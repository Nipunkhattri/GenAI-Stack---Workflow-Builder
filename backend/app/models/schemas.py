from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, EmailStr
from uuid import UUID


# User/Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    username: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[UUID] = None


# Node Configuration Schemas
class NodePosition(BaseModel):
    x: float
    y: float


class NodeData(BaseModel):
    label: str
    config: dict = Field(default_factory=dict)


class WorkflowNode(BaseModel):
    id: str
    type: str
    position: NodePosition
    data: NodeData


class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


# Workflow Schemas
class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: list[WorkflowNode] = Field(default_factory=list)
    edges: list[WorkflowEdge] = Field(default_factory=list)


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[list[WorkflowNode]] = None
    edges: Optional[list[WorkflowEdge]] = None


class WorkflowResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    nodes: list[dict]
    edges: list[dict]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class WorkflowListResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Document Schemas
class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    collection_name: str
    chunk_count: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Chat Schemas
class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatExecuteRequest(BaseModel):
    query: str
    workflow_id: Optional[UUID] = None
    session_id: Optional[UUID] = None
    workflow_config: Optional[dict] = None  # Live workflow config from frontend


class ChatExecuteResponse(BaseModel):
    response: str
    session_id: UUID


# Validation Schemas
class ValidationResult(BaseModel):
    is_valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
