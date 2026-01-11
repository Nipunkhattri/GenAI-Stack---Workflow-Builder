from typing import TypedDict, Optional, Annotated
from operator import add


class WorkflowState(TypedDict):
    """State passed between LangGraph nodes."""
    
    query: str
    
    node_configs: dict
    
    context: Optional[str]
    collection_name: Optional[str]
    
    llm_response: Optional[str]
    
    web_search_results: Optional[str]
    
    final_output: Optional[str]
    
    workflow_id: Optional[str]
    active_nodes: list[str]
    
    error: Optional[str]
