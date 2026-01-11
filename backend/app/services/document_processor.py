"""
Document Processor using LangChain components.
Uses PyPDFLoader and RecursiveCharacterTextSplitter.
"""
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document


class DocumentProcessor:
    """Process documents using LangChain loaders and splitters."""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            add_start_index=True,
        )
    
    def load_pdf(self, file_path: str) -> list[Document]:
        """Load a PDF file and return documents."""
        loader = PyPDFLoader(file_path)
        return loader.load()
    
    def split_documents(self, documents: list[Document]) -> list[Document]:
        """Split documents into chunks."""
        return self.text_splitter.split_documents(documents)
    
    def process_file(self, file_path: str) -> list[Document]:
        """Load and split a PDF file."""
        documents = self.load_pdf(file_path)
        return self.split_documents(documents)
    
    def get_texts_from_documents(self, documents: list[Document]) -> list[str]:
        """Extract plain text from documents."""
        return [doc.page_content for doc in documents]
