from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import get_settings


class LLMService:
    """LLM service using LangChain chat models."""
    
    def __init__(
        self, 
        provider: str = "openai", 
        model: str = None, 
        api_key: str = None
    ):
        settings = get_settings()
        self.provider = provider
        
        if provider == "openai":
            self.llm: BaseChatModel = ChatOpenAI(
                api_key=api_key or settings.openai_api_key,
                model=model or "gpt-4o-mini",
                temperature=0.7
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}. Only OpenAI is supported.")
    
    async def generate(
        self,
        query: str,
        context: str = None,
        custom_prompt: str = None,
        temperature: float = 0.7
    ) -> str:
        """Generate a response."""
        self.llm.temperature = temperature
        
        base_instruction = (
            "CRITICAL INSTRUCTION: You have access to 'Document Context' (from uploaded files) and 'Web Search Results'.\n"
            "1. The 'Document Context' is your PRIMARY source of truth. It contains specific private information.\n"
            "2. ALWAYS prioritize facts from 'Document Context' over 'Web Search Results' or general knowledge.\n"
            "3. Only use 'Web Search Results' to answer questions NOT covered by the 'Document Context'.\n"
            "4. If the 'Document Context' answers the query, ignore generic definitions from the web."
        )

        if custom_prompt:
            if context and "{context}" in custom_prompt:
                content = custom_prompt.replace("{context}", context)
            elif context:
                content = f"{custom_prompt}\n\n=== DOCUMENT CONTEXT ===\n{context}\n========================"
            else:
                content = custom_prompt
                
            if "{query}" in content:
                content = content.replace("{query}", query)
        else:
            content = "You are a helpful assistant."
            if context:
                content += f"\n\n=== DOCUMENT CONTEXT ===\n{context}\n========================"
        
        system_content = f"{base_instruction}\n\n{content}"
        
        messages = [
            SystemMessage(content=system_content),
            HumanMessage(content=query)
        ]
        
        response = await self.llm.ainvoke(messages)
        return response.content
    
    def get_llm(self) -> BaseChatModel:
        """Return the LangChain LLM for use in chains."""
        return self.llm
