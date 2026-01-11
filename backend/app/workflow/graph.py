from langgraph.graph import StateGraph, END
from app.workflow.state import WorkflowState
from app.workflow.nodes import (
    user_query_node,
    knowledge_base_node,
    llm_engine_node,
    output_node
)


class WorkflowGraphBuilder:
    """Builds and executes LangGraph workflows from frontend configuration."""
    
    NODE_MAPPING = {
        "userQuery": user_query_node,
        "knowledgeBase": knowledge_base_node,
        "llmEngine": llm_engine_node,
        "output": output_node
    }
    
    def build_from_config(self, nodes: list[dict], edges: list[dict]) -> StateGraph:
        """
        Build a LangGraph from frontend workflow configuration.
        
        Args:
            nodes: List of node configurations from React Flow
            edges: List of edge configurations from React Flow
        
        Returns:
            Compiled LangGraph
        """
        graph = StateGraph(WorkflowState)
        
        node_types = {}
        for node in nodes:
            node_id = node["id"]
            node_type = node["type"]
            node_types[node_id] = node_type
        
        adjacency = {}
        for edge in edges:
            source = edge["source"]
            target = edge["target"]
            if source not in adjacency:
                adjacency[source] = []
            adjacency[source].append(target)
        
        all_targets = set()
        for edge in edges:
            all_targets.add(edge["target"])
        
        entry_node = None
        for node in nodes:
            if node["id"] not in all_targets:
                entry_node = node["id"]
                break
        
        if not entry_node:
            entry_node = nodes[0]["id"] if nodes else None
        
        active_nodes = []
        print(f"\n=== BUILDING WORKFLOW GRAPH ===")
        print(f"Node types found: {node_types}")
        for node_id, node_type in node_types.items():
            if node_type in self.NODE_MAPPING:
                graph.add_node(node_id, self.NODE_MAPPING[node_type])
                active_nodes.append(node_id)
                print(f"Added node: {node_id} (type: {node_type})")
        
        if entry_node:
            print(f"Entry node: {entry_node}")
            graph.set_entry_point(entry_node)
        
        pruned_adj = self._prune_redundant_edges(adjacency)
        print(f"Original adjacency: {adjacency}")
        print(f"Pruned adjacency: {pruned_adj}")
        
        for source, targets in pruned_adj.items():
            for target in targets:
                if source in active_nodes and target in active_nodes:
                    graph.add_edge(source, target)
                    print(f"Added edge: {source} -> {target}")
        
        all_sources = set(adjacency.keys())
        for node_id in active_nodes:
            if node_id not in all_sources:
                graph.add_edge(node_id, END)
                print(f"Added exit edge: {node_id} -> END")
        
        print(f"=== END BUILDING WORKFLOW GRAPH ===\n")
        
        return graph.compile()
    
    def _prune_redundant_edges(self, adjacency: dict) -> dict:
        """
        Remove direct edges if an indirect path exists (Transitive Reduction).
        Example: If A->B, B->C, and A->C exist, remove A->C.
        
        Args:
            adjacency: Dictionary mapping source nodes to lists of target nodes
            
        Returns:
            Pruned adjacency dictionary
        """
        pruned_adj = {k: list(v) for k, v in adjacency.items()}
        
        def has_path(start, end, current_adj):
            queue = [start]
            visited = set()
            
            while queue:
                node = queue.pop(0)
                if node == end:
                    return True
                
                if node in visited:
                    continue
                visited.add(node)
                
                for neighbor in current_adj.get(node, []):
                    queue.append(neighbor)
            return False

        for source in list(adjacency.keys()):
            for target in list(adjacency[source]):
                if target in pruned_adj.get(source, []):
                    pruned_adj[source].remove(target)
                    
                    if has_path(source, target, pruned_adj):
                        print(f"Pruning redundant edge: {source} -> {target}")
                    else:
                        pruned_adj[source].append(target)
        
        return pruned_adj

    async def execute(
        self,
        nodes: list[dict],
        edges: list[dict],
        query: str,
        node_configs: dict
    ) -> str:
        """
        Execute a workflow with a query.
        
        Args:
            nodes: Workflow nodes from frontend
            edges: Workflow edges from frontend
            query: User's query
            node_configs: Configuration for each node
        
        Returns:
            Final response string
        """
        try:
            graph = self.build_from_config(nodes, edges)
            
            initial_state = {
                "query": query,
                "node_configs": node_configs,
                "context": None,
                "collection_name": None,
                "llm_response": None,
                "web_search_results": None,
                "final_output": None,
                "workflow_id": None,
                "active_nodes": [],
                "error": None
            }
            
            print(f"\n=== Executing workflow graph ===")
            result = await graph.ainvoke(initial_state)
            print(f"Graph execution completed. Result keys: {list(result.keys())}")
            print(f"Final output: {result.get('final_output')}")
            print(f"LLM response: {result.get('llm_response')}")
            print(f"Error: {result.get('error')}")
            print(f"=== End workflow execution ===\n")
            
            final_output = result.get("final_output", "No response generated.")
            return final_output if final_output else "No response generated."
        
        except Exception as e:
            print(f"\n=== Workflow execution exception ===")
            print(f"Error: {str(e)}")
            import traceback
            traceback.print_exc()
            print(f"=== End exception ===\n")
            return f"Workflow execution error: {str(e)}"
