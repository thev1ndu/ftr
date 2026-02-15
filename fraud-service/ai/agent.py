from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from ai.tools import fraud
from ai.prompts import SYSTEM_PROMPT

# Initialize a global in-memory checkpointer for the application lifecycle
# This replaces the SQLite one for now, as SqliteSaver was not available in this env version
checkpointer = MemorySaver()

# Initialize LLM and Tools once
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
tools = [fraud]

# Create the graph (agent) once
# This is the "Correct Format" utilizing prebuilt standard components
graph = create_react_agent(llm, tools=tools, checkpointer=checkpointer)

def get_agent():
    """
    Returns the compiled graph functionality.
    Use with:
      config = {"configurable": {"thread_id": session_id}}
      graph.invoke(..., config=config)
    """
    return graph

def get_system_message():
    return SystemMessage(content=SYSTEM_PROMPT)