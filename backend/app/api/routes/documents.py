import os
import uuid
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.database import Document, Workflow
from app.models.schemas import DocumentResponse
from app.services import DocumentProcessor, EmbeddingService, VectorStore

router = APIRouter()

UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    workflow_id: UUID = Form(...),
    embedding_provider: str = Form(default="openai"),
    embedding_model: str = Form(default="text-embedding-3-small"),
    api_key: str = Form(default=""),
    db: AsyncSession = Depends(get_db)
):
    """Upload a document for the knowledge base (embeddings will be created on first use)."""
    print(f"Received upload request for workflow: {workflow_id}")
    print(f"API Key received (length): {len(api_key) if api_key else 0}")
    print(f"API Key value (first 5 chars): {api_key[:5] if api_key else 'None'}")
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    file_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    file_path = UPLOAD_DIR / f"{file_id}{file_extension}"
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    try:
        collection_name = f"workflow_{workflow_id}_{file_id}"
        
        embedding_service = EmbeddingService(
            provider=embedding_provider, 
            api_key=api_key,
            model=embedding_model
        )
        processor = DocumentProcessor()
        
        docs = processor.process_file(str(file_path))
        chunk_count = len(docs)
        
        if chunk_count > 0:
            dimension = embedding_service.get_dimension()
            
            vector_store = VectorStore(
                embeddings=embedding_service.get_embeddings_model(),
                dimension=dimension
            )
            vector_store.add_documents(
                collection_name=collection_name,
                documents=docs,
                embeddings=embedding_service.get_embeddings_model()
            )
        
        db_document = Document(
            workflow_id=workflow_id,
            filename=file.filename,
            file_path=str(file_path),
            collection_name=collection_name,
            chunk_count=str(chunk_count)
        )
        db.add(db_document)
        await db.commit()
        await db.refresh(db_document)
        
        return db_document
    
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    workflow_id: UUID = None,
    db: AsyncSession = Depends(get_db)
):
    """List all documents, optionally filtered by workflow."""
    query = select(Document)
    if workflow_id:
        query = query.where(Document.workflow_id == workflow_id)
    
    result = await db.execute(query.order_by(Document.created_at.desc()))
    documents = result.scalars().all()
    return documents


@router.delete("/{document_id}")
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a document and its embeddings."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    vector_store = VectorStore()
    vector_store.delete_collection(document.collection_name)
    
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    await db.delete(document)
    await db.commit()
    
    return {"message": "Document deleted successfully"}
