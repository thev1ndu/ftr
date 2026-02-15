from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from app.services.fraud.ai.tools import fraud, get_recent_transaction_count, check_beneficiary_history
from app.services.fraud.ai.prompts import SYSTEM_PROMPT
from app.core.config import get_settings

# Initialize a global in-memory checkpointer for the application lifecycle
checkpointer = MemorySaver()

# Initialize LLM and Tools once
_agent_instance = None

def get_agent():
    global _agent_instance
    if _agent_instance is None:
        settings = get_settings()
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=settings.OPENAI_API_KEY)
        tools = [fraud, get_recent_transaction_count, check_beneficiary_history]
        _agent_instance = create_react_agent(llm, tools=tools, checkpointer=checkpointer)
    return _agent_instance

def get_system_message():
    return SystemMessage(content=SYSTEM_PROMPT)
