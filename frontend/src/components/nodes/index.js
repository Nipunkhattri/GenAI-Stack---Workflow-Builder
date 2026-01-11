import UserQueryNode from './UserQueryNode';
import KnowledgeBaseNode from './KnowledgeBaseNode';
import LLMEngineNode from './LLMEngineNode';
import OutputNode from './OutputNode';

export const nodeTypes = {
    userQuery: UserQueryNode,
    knowledgeBase: KnowledgeBaseNode,
    llmEngine: LLMEngineNode,
    output: OutputNode,
};
