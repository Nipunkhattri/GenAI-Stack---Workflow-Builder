from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.database import Workflow, User
from app.models.schemas import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    WorkflowListResponse,
    ValidationResult
)
from app.api.routes.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=list[WorkflowListResponse])
async def list_workflows(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all workflows for the current user."""
    result = await db.execute(
        select(Workflow)
        .where(Workflow.user_id == current_user.id)
        .order_by(Workflow.updated_at.desc())
    )
    workflows = result.scalars().all()
    return workflows


@router.post("/", response_model=WorkflowResponse)
async def create_workflow(
    workflow: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new workflow for the current user."""
    db_workflow = Workflow(
        name=workflow.name,
        description=workflow.description,
        nodes=[node.model_dump() for node in workflow.nodes],
        edges=[edge.model_dump() for edge in workflow.edges],
        user_id=current_user.id
    )
    db.add(db_workflow)
    await db.commit()
    await db.refresh(db_workflow)
    return db_workflow


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a workflow by ID (only if owned by current user)."""
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: UUID,
    workflow_update: WorkflowUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a workflow (only if owned by current user)."""
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow_update.name is not None:
        workflow.name = workflow_update.name
    if workflow_update.description is not None:
        workflow.description = workflow_update.description
    if workflow_update.nodes is not None:
        workflow.nodes = [node.model_dump() for node in workflow_update.nodes]
    if workflow_update.edges is not None:
        workflow.edges = [edge.model_dump() for edge in workflow_update.edges]
    
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a workflow (only if owned by current user)."""
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id
        )
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    await db.delete(workflow)
    await db.commit()
    return {"message": "Workflow deleted successfully"}


@router.post("/validate", response_model=ValidationResult)
async def validate_workflow(workflow: WorkflowCreate):
    """Validate a workflow configuration."""
    errors = []
    warnings = []
    
    nodes = workflow.nodes
    edges = workflow.edges
    
    node_types = [node.type for node in nodes]
    
    if "userQuery" not in node_types:
        errors.append("Workflow must have a User Query component")
    
    if "output" not in node_types:
        errors.append("Workflow must have an Output component")
    
    if "llmEngine" not in node_types:
        warnings.append("Workflow should have an LLM Engine component to generate responses")
    
    if len(nodes) > 1 and len(edges) == 0:
        errors.append("Components must be connected to form a workflow")
    
    node_ids = {node.id for node in nodes}
    connected_targets = {edge.target for edge in edges}
    connected_sources = {edge.source for edge in edges}
    
    for node in nodes:
        if node.id not in connected_targets and node.id not in connected_sources:
            if len(nodes) > 1:
                warnings.append(f"Component '{node.data.label}' is not connected to the workflow")
    
    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )
