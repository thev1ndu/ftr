from typing import TypedDict, Annotated, List, Union
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from app.services.fraud.ai.tools import fraud, get_recent_transaction_count, check_beneficiary_history, get_pattern_summary
from app.services.fraud.ai.prompts import SYSTEM_PROMPT
from app.core.config import get_settings
import json
import operator

# Define the state
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    transaction_id: str
    risk_score: int
    decision: str
    feedback: str

# Tools list
tools = [fraud, get_recent_transaction_count, check_beneficiary_history, get_pattern_summary]

# Initialize LLM
settings = get_settings()
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=settings.OPENAI_API_KEY)

# Bind tools to LLM
llm_with_tools = llm.bind_tools(tools)

def agent_node(state: AgentState):
    messages = state["messages"]
    # If the first message is not SystemMessage, add it.
    if not isinstance(messages[0], SystemMessage):
        messages.insert(0, SystemMessage(content=SYSTEM_PROMPT))
        
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def human_review_node(state: AgentState):
    # Placeholder for interruption
    pass_msg = HumanMessage(content=f"Human Review Action: {state.get('decision', 'UNKNOWN')} - {state.get('feedback', 'No feedback')}")
    return {"messages": [pass_msg]}

def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    
    # If there are tool calls, go to action
    if last_message.tool_calls:
        return "tools"
    
    # Check for blocking decision in the content
    content = last_message.content
    try:
        # Clean markdown if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
            
        data = json.loads(content)
        decision = data.get("decision", "ALLOW")
        score = data.get("score", 0)
        
        # If feedback exists, we already reviewed, so END
        if state.get("feedback"):
             return END

        # Send to human review: BLOCK, score > 75, or REVIEW (50–75) so user can approve/decline
        if decision == "BLOCK" or score > 75 or decision == "REVIEW":
            return "human_review"
            
    except:
        pass
        
    return END

# Define graph
workflow = StateGraph(AgentState)

from langgraph.prebuilt import ToolNode
tool_node = ToolNode(tools)

workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)
workflow.add_node("human_review", human_review_node)

workflow.set_entry_point("agent")

workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        "human_review": "human_review",
        END: END
    }
)

workflow.add_edge("tools", "agent")
workflow.add_edge("human_review", "agent") # Loop back to agent to finalize

# Export workflow only
def get_system_message():
    return SystemMessage(content=SYSTEM_PROMPT)
