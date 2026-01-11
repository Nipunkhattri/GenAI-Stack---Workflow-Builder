from langchain_openai import OpenAIEmbeddings
from langchain_core.embeddings import Embeddings
from app.core.config import get_settings


class EmbeddingService:
    """Embedding service using LangChain embeddings."""
    
    EMBEDDING_DIMENSIONS = {
        "text-embedding-3-small": 1536,
        "text-embedding-3-large": 3072,
        "text-embedding-ada-002": 1536,
    }
    
    def __init__(self, provider: str = "openai", api_key: str = None, model: str = None):
        settings = get_settings()
        self.provider = provider
        self.model = model or "text-embedding-3-small"
        
        if provider == "openai":
            self.embeddings: Embeddings = OpenAIEmbeddings(
                api_key=api_key or settings.openai_api_key,
                model=self.model
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}. Only OpenAI is supported.")
    
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts."""
        return self.embeddings.embed_documents(texts)
    
    def embed_query(self, text: str) -> list[float]:
        """Generate embedding for a single query."""
        return self.embeddings.embed_query(text)
    
    def get_embeddings_model(self) -> Embeddings:
        """Return the LangChain embeddings model for use with vector stores."""
        return self.embeddings
    
    def get_dimension(self) -> int:
        """Get the dimension of the embedding model."""
        return self.EMBEDDING_DIMENSIONS.get(self.model, 1536)
