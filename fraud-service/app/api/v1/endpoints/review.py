import json
import logging
from fastapi import APIRouter, HTTPException
from app.models.review import ReviewRequest
from app.services.fraud.ai.agent import workflow
from app.services.fraud.history import history_service
from app.core.config import get_settings
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/review/{transaction_id}")
async def review_transaction(transaction_id: str, request: ReviewRequest):
    logger.info(f"Received review for {transaction_id}: {request.action}")
    
    config = {"configurable": {"thread_id": transaction_id}}
    settings = get_settings()
    async with AsyncSqliteSaver.from_conn_string(settings.CHECKPOINTS_DB_PATH) as checkpointer:
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

        output_text = final_state["messages"][-1].content
        decision, score, reason = "REVIEW", 50, "Processed by reviewer"
        try:
            if "```json" in output_text:
                raw = output_text.split("```json")[1].split("```")[0].strip()
            elif "```" in output_text:
                raw = output_text.split("```")[1].strip()
            else:
                raw = output_text
            data = json.loads(raw)
            decision = data.get("decision", request.action if request.action == "DECLINE" else "ALLOW")
            if request.action == "DECLINE":
                decision = "BLOCK"
            elif request.action == "APPROVE":
                decision = "ALLOW"
            score = data.get("score", 90 if decision == "BLOCK" else 10)
            reason = data.get("reason", reason)
        except json.JSONDecodeError:
            decision = "ALLOW" if request.action == "APPROVE" else "BLOCK"
            score = 10 if decision == "ALLOW" else 90
        history_service.update_transaction_decision(transaction_id, decision, float(score), reason)

        return {
            "status": "PROCESSED",
            "ai_response": output_text
        }
