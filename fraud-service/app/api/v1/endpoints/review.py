from fastapi import APIRouter, HTTPException
from app.models.review import ReviewRequest
from app.services.fraud.ai.agent import workflow
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/review/{transaction_id}")
async def review_transaction(transaction_id: str, request: ReviewRequest):
    logger.info(f"Received review for {transaction_id}: {request.action}")
    
    config = {"configurable": {"thread_id": transaction_id}}
    
    async with AsyncSqliteSaver.from_conn_string("checkpoints.db") as checkpointer:
        agent = workflow.compile(checkpointer=checkpointer, interrupt_before=["human_review"])
        
        # Check current state
        state_snapshot = await agent.aget_state(config)
        
        if not state_snapshot.next:
            # Check if history exists (to distinguish between not found and finished)
            if not state_snapshot.values:
                 raise HTTPException(status_code=404, detail="Transaction not found or session expired")
            return {"status": "ALREADY_PROCESSED", "message": "Transaction already processed."}

        # Prepare feedback message
        feedback_message = f"Human Reviewer Decision: {request.action}. Reason: {request.reason}."
        if request.action == "APPROVE":
            feedback_message += " Please Approve the transaction now."
        else:
            feedback_message += " Please Block the transaction now."

        # Update state with human feedback
        await agent.aupdate_state(
            config,
            {"messages": [HumanMessage(content=feedback_message)], "decision": request.action, "feedback": request.reason},
            as_node="human_review" 
        )
        
        # Resume execution
        logger.info(f"Resuming execution for {transaction_id}")
        final_state = await agent.ainvoke(None, config=config)
        
        # Extract final decision from the new AI output
        output_text = final_state["messages"][-1].content
        
        return {
            "status": "PROCESSED",
            "ai_response": output_text
        }
