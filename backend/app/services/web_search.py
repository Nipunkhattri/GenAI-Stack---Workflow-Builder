from langchain_community.utilities import SerpAPIWrapper
from app.core.config import get_settings


class WebSearchService:
    """Web search service using SerpAPI."""
    
    def __init__(self, api_key: str = None):
        settings = get_settings()
        self.api_key = api_key or settings.serpapi_api_key
        
        if self.api_key:
            self.search = SerpAPIWrapper(serpapi_api_key=self.api_key)
        else:
            self.search = None
    
    async def search_web(self, query: str) -> str:
        """Search the web and return results as text."""
        if not self.search:
            return "Web search not available - no API key configured."
        
        try:
            return self.search.run(query)
        except Exception as e:
            return f"Search error: {str(e)}"
    
    def get_search_results(self, query: str, num_results: int = 5) -> list[dict]:
        """Get structured search results."""
        if not self.search:
            return []
        
        try:
            results = self.search.results(query)
            organic_results = results.get("organic_results", [])[:num_results]
            
            return [
                {
                    "title": r.get("title", ""),
                    "link": r.get("link", ""),
                    "snippet": r.get("snippet", "")
                }
                for r in organic_results
            ]
        except Exception:
            return []
    
    def format_results_as_context(self, results: list[dict]) -> str:
        """Format search results as context for LLM."""
        if not results:
            return ""
        
        parts = ["Web Search Results:\n"]
        for i, r in enumerate(results, 1):
            parts.append(f"{i}. {r['title']}")
            parts.append(f"   {r['snippet']}")
            parts.append(f"   Source: {r['link']}\n")
        
        return "\n".join(parts)
