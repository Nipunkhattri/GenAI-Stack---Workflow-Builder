# GenAI Stack - Workflow Builder

A No-Code/Low-Code web application that enables users to visually create and interact with intelligent workflows. Connect user queries, documents (Knowledge Base), and LLMs to build powerful AI applications.

## Features

*   **Visual Workflow Builder**: Drag-and-drop interface using React Flow.
*   **Intelligent Components**:
    *   **User Query**: Entry point for chats.
    *   **Knowledge Base**: Upload PDFs, extract text (PyMuPDF), and generate embeddings (OpenAI/Gemini).
    *   **LLM Engine**: Interact with GPT-4, Gemini, etc., with optional Web Search (SerpAPI).
    *   **Output**: Chat interface with formatting support.
*   **Chat Interface**: Real-time interaction with your built workflows.
*   **Session Management**: Persistent chat history.
*   **Dashboard**: Manage multiple workflow stacks.

## Tech Stack

*   **Frontend**: React.js, Vite, TailwindCSS, React Flow, Redux Toolkit.
*   **Backend**: FastAPI, SQLAlchemy (Async), LangGraph.
*   **Database**: PostgreSQL (Docker) or SQLite (Local default).
*   **Vector Store**: Pinecone (via API) or ChromaDB (local).
*   **AI/ML**: OpenAI GPT-4, Gemini, PyMuPDF, LangChain.

## Prerequisites

*   Docker & Docker Compose
*   Node.js 18+ (for local dev)
*   Python 3.11+ (for local dev)

## Quick Start (Docker)

The easiest way to run the application is using Docker Compose.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Nipunkhattri/GenAI-Stack---Workflow-Builder
    cd GenAI-Stack---Workflow-Builder
    ```

2.  **Environment Setup**:
    Create a `.env` file in the `backend/` directory (or root, depending on your setup) based on `.env.example`.
    
    Required Configuration (Must be set in .env):
    ```env
    # Vector Database (Pinecone)
    PINECONE_API_KEY=...
    PINECONE_ENVIRONMENT=gcp-starter
    
    # Database Configuration
    DATABASE_URL=postgresql://postgres:postgres@postgres:5432/workflow_db
    DATABASE_SSL=false
    ```

    (Will be entered in UI):
    ```env
    OPENAI_API_KEY=
    SERPAPI_API_KEY=
    ```

3.  **Run with Docker Compose**:
    ```bash
    docker-compose up --build
    ```

4.  **Access the App**:
    *   Frontend: `http://localhost:5173`
    *   Backend API: `http://localhost:8000/docs`

## Local Development Setup

If you prefer running locally without Docker:

### Backend

1.  Navigate to `backend/`:
    ```bash
    cd backend
    ```
2.  Create virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configuration**:
    Create a `.env` file in `backend/`:
    ```env
    # Database (Local PostgreSQL)
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Workflow_db
    DATABASE_SSL=false
    
    # Vector Database (Required)
    PINECONE_API_KEY=...
    PINECONE_ENVIRONMENT=gcp-starter
    
    # API Keys (Will be entered in UI)
    OPENAI_API_KEY=
    SERPAPI_API_KEY=
    ```
5.  Run server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

### Frontend

1.  Navigate to `frontend/`:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run development server:
    ```bash
    npm run dev
    ```
4.  Access at `http://localhost:5173`.

## Architecture

1.  **Frontend**: React app manages the Workflow State via Redux. It communicates with the Backend API.
2.  **Backend**: FastAPI handles API requests.
    *   **Workflow Engine**: Uses `LangGraph` to compile the visual node graph into an executable state machine.
    *   **Execution**: When a user chats, the backend executes the graph nodes sequentially (or parallel where applicable).
    *   **Data**: Stores workflow definitions in PostgreSQL/SQLite. Stores Vectors in Pinecone.

```mermaid
graph TD
    subgraph Frontend ["Frontend (React + Vite)"]
        UI[User Interface]
        RF[React Flow Canvas]
        Redux[State Management]
    end

    subgraph Backend ["Backend (FastAPI)"]
        API[API Routes]
        WE["Workflow Engine (LangGraph)"]
        LE[LLM Service]
        VS[Vector Service]
    end

    subgraph Database [Data Layer]
        PG[(PostgreSQL/SQLite)]
        PC[(Pinecone Vector DB)]
    end

    UI --> Redux
    RF --> Redux
    Redux --> API
    API --> WE
    WE --> LE
    WE --> VS
    LE --> OpenAI["OpenAI / Gemini"]
    VS --> PC
    API --> PG
```

## Future Enhancements

*   **Workflow Templates**: Pre-built templates for common use cases like RAG, content generation, and data extraction.
*   **Export/Import**: Functionality to save and share workflow configurations as JSON files.
*   **Local LLM Support**: Integration with Ollama or LocalAI to run models entirely on-premise.
*   **Execution History**: A dashboard to view logs, performance metrics, and state transitions of previous runs.
*   **Custom Tooling**: Interface to register custom Python functions or API endpoints as executable tools within nodes.