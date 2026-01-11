"""
LangGraph workflow nodes using LangChain services.
"""
from app.workflow.state import WorkflowState
from app.services import EmbeddingService, VectorStore, LLMService, WebSearchService


def user_query_node(state: WorkflowState) -> dict:
    """Entry point node - processes the user query."""
    print(f"\n=== USER QUERY NODE ===")
    print(f"Query: {state['query']}")
    print(f"=== END USER QUERY NODE ===\n")
    return {"query": state["query"]}


def knowledge_base_node(state: WorkflowState) -> dict:
    """Knowledge Base node - retrieves relevant context from vector store."""
    print(f"\n=== KNOWLEDGE BASE NODE ===")
    node_configs = state.get("node_configs", {})
    kb_config = node_configs.get("knowledgeBase", {})
    
    collection_name = kb_config.get("collection_name")
    embedding_provider = kb_config.get("embedding_provider", "openai")
    embedding_model = kb_config.get("embedding_model", "text-embedding-3-small")
    api_key = kb_config.get("api_key")
    file_path = kb_config.get("file_path")  # Get file path from config
    
    print(f"Collection name: {collection_name}")
    print(f"Embedding provider: {embedding_provider}")
    print(f"Embedding model: {embedding_model}")
    print(f"API key present: {bool(api_key)}")
    print(f"File path: {file_path}")
    print(f"Query: {state['query']}")
    
    if not collection_name:
        print(f"No collection name found, returning None context")
        print(f"=== END KNOWLEDGE BASE NODE ===\n")
        return {"context": None}
    
    try:
        embedding_service = EmbeddingService(
            provider=embedding_provider,
            api_key=api_key,
            model=embedding_model
        )
        
        dimension = embedding_service.get_dimension()
        
        vector_store = VectorStore(
            embeddings=embedding_service.get_embeddings_model(),
            dimension=dimension
        )
        
        if not vector_store.collection_exists(collection_name):
            print(f"Collection {collection_name} does not exist.")
            print(f"=== END KNOWLEDGE BASE NODE ===\n")
            return {"context": None}
        
        docs = vector_store.similarity_search(
            collection_name=collection_name,
            query=state["query"],
            embeddings=embedding_service.get_embeddings_model(),
            k=5
        )
        
        print(f"Found {len(docs) if docs else 0} documents")
        if docs:
            context = "\n\n".join([doc.page_content for doc in docs])
            print(f"Context length: {len(context)} chars")
            print(f"=== PDF CONTEXT PREVIEW (First 500 chars) ===")
            print(f"{context[:500]}...")
            print(f"=============================================")
            print(f"=== END KNOWLEDGE BASE NODE ===\n")
            return {"context": context}
        
        print(f"No documents found, returning None context")
        print(f"=== END KNOWLEDGE BASE NODE ===\n")
        return {"context": None}
    
    except Exception as e:
        print(f"ERROR in knowledge base node: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"=== END KNOWLEDGE BASE NODE ===\n")
        return {"context": None, "error": str(e)}


async def llm_engine_node(state: WorkflowState) -> dict:
    """LLM Engine node - generates response using configured LLM."""
    node_configs = state.get("node_configs", {})
    llm_config = node_configs.get("llmEngine", {})
    
    provider = llm_config.get("provider", "openai")
    model = llm_config.get("model", "gpt-4o-mini")
    api_key = llm_config.get("api_key")
    custom_prompt = llm_config.get("prompt")
    temperature = llm_config.get("temperature", 0.7)
    use_web_search = llm_config.get("use_web_search", False)
    serpapi_key = llm_config.get("serpapi_key")
    
    print(f"\n=== DEBUG: LLM Engine Node ===")
    print(f"Provider: {provider}")
    print(f"Model: {model}")
    print(f"API Key present: {bool(api_key)}")
    print(f"API Key (first 10 chars): {api_key[:10] if api_key else 'None'}...")
    print(f"Custom prompt: {custom_prompt[:100] if custom_prompt else 'None'}...")
    print(f"Temperature: {temperature}")
    print(f"Use web search: {use_web_search}")
    print(f"Query from state: {state.get('query')}")
    print(f"Query from state: {state.get('query')}")
    
    ctx = state.get('context')
    if ctx:
        print(f"=== LLM NODE RECEIVED CONTEXT ===")
        print(f"Length: {len(ctx)} chars")
        print(f"Preview: {ctx[:200]}...")
        print(f"=============================")
    else:
        print(f"Context from state: None")
    
    model_mapping = {
        "gpt-4o-mini": "gpt-4o-mini",
        "gpt-4o": "gpt-4o",
        "gpt-4-turbo": "gpt-4-turbo",
        "gpt-3.5-turbo": "gpt-3.5-turbo"
    }
    
    actual_model = model_mapping.get(model, model)
    print(f"Actual model being used: {actual_model}")
    
    try:
        context = state.get("context", "")
        
        web_context = ""
        if use_web_search and serpapi_key:
            print(f"Performing web search...")
            web_search = WebSearchService(api_key=serpapi_key)
            results = web_search.get_search_results(state["query"])
            web_context = web_search.format_results_as_context(results)
            print(f"Web search results length: {len(web_context)} chars")
        
        full_context = ""
        if context:
            full_context += f"Document Context:\n{context}\n\n"
        if web_context:
            full_context += web_context
        
        print(f"Full context length: {len(full_context)} chars")
        print(f"Calling LLM service...")
        
        llm_service = LLMService(
            provider=provider,
            model=actual_model,
            api_key=api_key
        )
        
        response = await llm_service.generate(
            query=state["query"],
            context=full_context if full_context else None,
            custom_prompt=custom_prompt,
            temperature=temperature
        )
        
        print(f"LLM Response received: {response[:200] if response else 'None'}...")
        print(f"=== END DEBUG: LLM Engine Node ===\n")
        
        return {
            "llm_response": response,
            "web_search_results": web_context if web_context else None
        }
    
    except Exception as e:
        print(f"LLM Engine Error: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"=== END DEBUG: LLM Engine Node ===\n")
        return {"llm_response": None, "error": str(e)}


async def output_node(state: WorkflowState) -> dict:
    """Output node - formats the final response."""
    print(f"\n=== OUTPUT NODE ===")
    response = state.get("llm_response")
    error = state.get("error")
    
    formatting_prompt = (
        "You are an expert technical writer. Refine the following response into a clean, professional, and well-structured format. "
        "Use bold headers for main sections (e.g., **Summary**, **Key Skills**, **Experience**, **Education**). "
        "Use bullet points for lists to improve readability. "
        "Do not remove any facts, but ensure the tone is polished and professional."
    )
    
    print(f"LLM Response: {response[:200] if response else 'None'}...")
    print(f"Error: {error}")
    print(f"Formatting Prompt: {formatting_prompt}")
    
    if error:
        final = f"Error: {error}"
        print(f"Returning error: {final}")
        print(f"=== END OUTPUT NODE ===\n")
        return {"final_output": final}
    
    if response:
        if formatting_prompt:
            print("Applying formatting prompt...")
            try:
                node_configs = state.get("node_configs", {})
                llm_config = node_configs.get("llmEngine", {})
                api_key = llm_config.get("api_key")
                
                llm_service = LLMService(
                    provider="openai",
                    model="gpt-4o-mini",
                    api_key=api_key
                )
                
                combined_query = f"{formatting_prompt}\n\n=== CONTENT TO REFINE ===\n{response}"
                
                formatted_response = await llm_service.generate(
                    query=combined_query,
                    context=None,
                    custom_prompt="You are an expert technical editor. Improve the structure and tone of the provided text.",
                    temperature=0.7
                )
                print(f"Formatted Response: {formatted_response[:200]}...")
                response = formatted_response
            except Exception as e:
                print(f"Error applying formatting: {str(e)}")
        
        print(f"Returning final response: {response[:200]}...")
        print(f"=== END OUTPUT NODE ===\n")
        return {"final_output": response}
    
    print(f"No response generated, returning default message")
    print(f"=== END OUTPUT NODE ===\n")
    return {"final_output": "No response generated."}
