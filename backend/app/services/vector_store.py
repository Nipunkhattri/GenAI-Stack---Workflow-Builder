from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from app.core.config import get_settings
import time


class VectorStore:
    """Vector store using Pinecone cloud service."""
    
    def __init__(self, embeddings: Embeddings = None, dimension: int = None):
        settings = get_settings()
        self._embeddings = embeddings
        self._dimension = dimension
        self._pc = None
        self._index_name = settings.pinecone_index_name
        self._api_key = settings.pinecone_api_key
        print(f"DEBUG: VectorStore init. Pinecone Index: {self._index_name}")
        print(f"DEBUG: VectorStore init. Pinecone Key Present: {bool(self._api_key)}")
        self._environment = settings.pinecone_environment
        
    def _get_pinecone_client(self):
        """Initialize Pinecone client."""
        if not self._pc:
            if not self._api_key:
                print("DEBUG: Pinecone API Key is MISSING in _get_pinecone_client")
            self._pc = Pinecone(api_key=self._api_key)
        return self._pc
    
    def _ensure_index_exists(self, dimension: int):
        """Ensure the Pinecone index exists."""
        pc = self._get_pinecone_client()
        
        existing_indexes = [index.name for index in pc.list_indexes()]
        
        if self._index_name not in existing_indexes:
            pc.create_index(
                name=self._index_name,
                dimension=dimension,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )
            while not pc.describe_index(self._index_name).status['ready']:
                time.sleep(1)
    
    def get_or_create_collection(
        self, 
        collection_name: str, 
        embeddings: Embeddings = None
    ) -> PineconeVectorStore:
        """
        Get or create a Pinecone namespace (collection).
        
        Args:
            collection_name: Namespace name in Pinecone
            embeddings: Embeddings model
        """
        emb = embeddings or self._embeddings
        if not emb:
            raise ValueError("Embeddings model required")
        
        dimension = self._dimension
        if dimension is None:
            test_embedding = emb.embed_query("test")
            dimension = len(test_embedding)
        
        self._ensure_index_exists(dimension)
        
        return PineconeVectorStore(
            index_name=self._index_name,
            embedding=emb,
            namespace=collection_name,
            pinecone_api_key=self._api_key
        )
    
    def add_documents(
        self,
        collection_name: str,
        documents: list[Document],
        embeddings: Embeddings = None
    ) -> list[str]:
        """Add documents to a collection (namespace)."""
        vector_store = self.get_or_create_collection(collection_name, embeddings)
        return vector_store.add_documents(documents)
    
    def similarity_search(
        self,
        collection_name: str,
        query: str,
        embeddings: Embeddings = None,
        k: int = 5
    ) -> list[Document]:
        """Search for similar documents."""
        vector_store = self.get_or_create_collection(collection_name, embeddings)
        return vector_store.similarity_search(query, k=k)
    
    def similarity_search_with_score(
        self,
        collection_name: str,
        query: str,
        embeddings: Embeddings = None,
        k: int = 5
    ) -> list[tuple[Document, float]]:
        """Search for similar documents with scores."""
        vector_store = self.get_or_create_collection(collection_name, embeddings)
        return vector_store.similarity_search_with_score(query, k=k)
    
    def as_retriever(
        self,
        collection_name: str,
        embeddings: Embeddings = None,
        search_kwargs: dict = None
    ):
        """Get a retriever for this collection."""
        vector_store = self.get_or_create_collection(collection_name, embeddings)
        return vector_store.as_retriever(search_kwargs=search_kwargs or {"k": 5})
    
    def delete_collection(self, collection_name: str, embeddings: Embeddings = None):
        """Delete a collection (namespace) by deleting all vectors in it."""
        try:
            pc = self._get_pinecone_client()
            index = pc.Index(self._index_name)
            index.delete(delete_all=True, namespace=collection_name)
        except Exception:
            pass
    
    def collection_exists(self, collection_name: str) -> bool:
        """Check if a collection (namespace) exists and has documents."""
        try:
            pc = self._get_pinecone_client()
            
            existing_indexes = [index.name for index in pc.list_indexes()]
            if self._index_name not in existing_indexes:
                return False
            
            index = pc.Index(self._index_name)
            stats = index.describe_index_stats()
            namespaces = stats.get('namespaces', {})
            
            exists = collection_name in namespaces and namespaces[collection_name].get('vector_count', 0) > 0
            
            if not exists:
                print(f"DEBUG: Collection '{collection_name}' not found or empty.")
                print(f"DEBUG: Available namespaces: {list(namespaces.keys())}")
                if collection_name in namespaces:
                    print(f"DEBUG: Vector count for '{collection_name}': {namespaces[collection_name].get('vector_count', 0)}")
            
            return exists
        except Exception as e:
            print(f"DEBUG: Error checking collection existence: {str(e)}")
            return False
