from uuid import UUID, uuid4
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.database import Workflow, ChatSession, ChatMessage, Document
from app.models.schemas import (
    ChatExecuteRequest,
    ChatExecuteResponse,
    ChatMessageResponse
)
from app.workflow import WorkflowGraphBuilder
from app.services import VectorStore

router = APIRouter()


@router.post("/execute", response_model=ChatExecuteResponse)
async def execute_chat(
    request: ChatExecuteRequest,
    db: AsyncSession = Depends(get_db)
):
    """Execute a query through the workflow."""
    
    if request.workflow_config:
        nodes = request.workflow_config.get("nodes", [])
        edges = request.workflow_config.get("edges", [])
        workflow_id = request.workflow_id
    elif request.workflow_id:
        result = await db.execute(
            select(Workflow).where(Workflow.id == request.workflow_id)
        )
        workflow = result.scalar_one_or_none()
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        nodes = workflow.nodes
        edges = workflow.edges
        workflow_id = workflow.id
    else:
        raise HTTPException(status_code=400, detail="Either workflow_id or workflow_config is required")
    
    session = None
    if request.session_id:
        session_result = await db.execute(
            select(ChatSession).where(ChatSession.id == request.session_id)
        )
        session = session_result.scalar_one_or_none()
    
    if not session and workflow_id:
        session = ChatSession(workflow_id=workflow_id)
        db.add(session)
        await db.commit()
        await db.refresh(session)
    
    if session:
        user_message = ChatMessage(
            session_id=session.id,
            role="user",
            content=request.query
        )
        db.add(user_message)
        await db.commit()
    
    node_configs = {}
    print(f"\n=== DEBUG: Building node configs ===")
    print(f"Received {len(nodes)} nodes")
    for node in nodes:
        node_type = node.get("type")
        node_data = node.get("data", {})
        config = node_data.get("config", {})
        print(f"Node type: {node_type}, config keys: {list(config.keys())}")
        
        if node_type == "knowledgeBase":
            print(f"Knowledge Base - workflow_id: {workflow_id}")
            
            target_path = config.get("file_path")
            if not target_path and isinstance(config.get("file"), dict):
                target_path = config.get("file", {}).get("path")
            
            print(f"Target file path from config: {target_path}")

            if workflow_id:
                doc_result = await db.execute(
                    select(Document).where(Document.workflow_id == workflow_id)
                )
                documents = doc_result.scalars().all()
                print(f"Found {len(documents)} total documents for workflow")
                
                selected_doc = None
                
                if target_path and documents:
                    for doc in documents:
                        if doc.file_path == target_path or (target_path and target_path.replace("\\", "/").split("/")[-1] == doc.file_path.replace("\\", "/").split("/")[-1]):
                            selected_doc = doc
                            print(f"Found matching DB record: {doc.filename} -> {doc.collection_name}")
                            break
                
                if selected_doc:
                    try:
                        vector_store = VectorStore()
                        if vector_store.collection_exists(selected_doc.collection_name):
                            print(f"Valid collection confirmed: {selected_doc.collection_name}")
                            config["collection_name"] = selected_doc.collection_name
                            config["file_path"] = selected_doc.file_path
                        else:
                            print(f"CRITICAL: Collection '{selected_doc.collection_name}' for file '{selected_doc.filename}' IS MISSING in Pinecone.")
                    except Exception as e:
                        print(f"Error checking vector store: {str(e)}")
                else:
                    print("WARNING: No database record found matching the configured file path.")
            
            node_configs["knowledgeBase"] = config
        
        elif node_type == "llmEngine":
            node_configs["llmEngine"] = config
            print(f"LLM Engine config: api_key present = {'api_key' in config and bool(config.get('api_key'))}")
    
    print(f"Final node_configs: {list(node_configs.keys())}")
    print(f"=== END DEBUG ===\n")
    
    graph_builder = WorkflowGraphBuilder()
    try:
        response = await graph_builder.execute(
            nodes=nodes,
            edges=edges,
            query=request.query,
            node_configs=node_configs
        )
    except Exception as e:
        print(f"Workflow execution error: {str(e)}")
        import traceback
        traceback.print_exc()
        response = f"Error executing workflow: {str(e)}"
    
    if response is None:
        response = "Sorry, there was an error processing your request."
    
    if session:
        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=response
        )
        db.add(assistant_message)
        await db.commit()
    
    return ChatExecuteResponse(
        response=response,
        session_id=session.id if session else uuid4()
    )


@router.get("/sessions/{workflow_id}", response_model=list[dict])
async def get_chat_sessions(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all chat sessions for a workflow."""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.workflow_id == workflow_id)
        .order_by(ChatSession.created_at.desc())
    )
    sessions = result.scalars().all()
    
    return [
        {
            "id": session.id,
            "created_at": session.created_at
        }
        for session in sessions
    ]


@router.get("/messages/{session_id}", response_model=list[ChatMessageResponse])
async def get_chat_messages(
    session_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all messages in a chat session."""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()
    return messages
