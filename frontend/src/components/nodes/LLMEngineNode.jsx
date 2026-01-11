import { Handle, Position, useEdges, useReactFlow } from '@xyflow/react';
import { Sparkles, Settings, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';

function LLMEngineNode({ id, data, selected }) {
    const { setNodes } = useReactFlow();
    const [showApiKey, setShowApiKey] = useState(false);
    const [showSerpKey, setShowSerpKey] = useState(false);

    const [model, setModel] = useState(data?.config?.model || 'gpt-4o-mini');
    const [apiKey, setApiKey] = useState(data?.config?.api_key || '');
    const [prompt, setPrompt] = useState(data?.config?.prompt || 'You are a helpful PDF assistant. Use web search if the PDF lacks context');
    const [temperature, setTemperature] = useState(data?.config?.temperature || 0.75);
    const [useWebSearch, setUseWebSearch] = useState(data?.config?.use_web_search ?? true);
    const [serpApiKey, setSerpApiKey] = useState(data?.config?.serpapi_key || '');

    const edges = useEdges();

    const connectedInputs = useMemo(() => {
        const connections = { context: false, query: false };
        edges.forEach(edge => {
            if (edge.target === id) {
                if (edge.targetHandle === 'context') connections.context = true;
                if (edge.targetHandle === 'query') connections.query = true;
            }
        });
        return connections;
    }, [edges, id]);

    const getProvider = (modelName) => {
        return 'openai';
    };
    const updateNodeData = useCallback(() => {
        setNodes(nodes => nodes.map(node => {
            if (node.id === id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        config: {
                            provider: getProvider(model),
                            model,
                            api_key: apiKey,
                            prompt,
                            temperature: parseFloat(temperature),
                            use_web_search: useWebSearch,
                            serpapi_key: serpApiKey
                        }
                    }
                };
            }
            return node;
        }));
    }, [setNodes, id, model, apiKey, prompt, temperature, useWebSearch, serpApiKey]);

    useEffect(() => {
        const timer = setTimeout(updateNodeData, 300);
        return () => clearTimeout(timer);
    }, [model, apiKey, prompt, temperature, useWebSearch, serpApiKey, updateNodeData]);

    return (
        <div className={`w-[280px] bg-white rounded-2xl border border-gray-200 shadow-lg overflow-visible relative ${selected ? 'border-gray-300 shadow-xl' : ''}`}>
            <div className="flex items-center gap-3 px-4 py-3.5">
                <Sparkles size={18} className="text-black" />
                <span className="font-semibold text-sm text-gray-900 flex-1">LLM (OpenAI)</span>
                <Settings size={16} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>

            <div className="bg-[#eff6ff] px-4 py-2">
                <span className="text-xs text-black">Run a query with OpenAI LLM</span>
            </div>

            <div className="p-4 pb-6">
                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Model</label>
                    <div className="relative">
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white appearance-none pr-8 focus:outline-none focus:border-gray-300 cursor-pointer"
                        >
                            <optgroup label="OpenAI">
                                <option value="gpt-4o-mini">GPT 4o- Mini</option>
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </optgroup>
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">API Key</label>
                    <div className="relative">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-gray-300"
                        />
                        <button
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
                            onClick={() => setShowApiKey(!showApiKey)}
                        >
                            {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </div>

                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white resize-none focus:outline-none focus:border-gray-300"
                    />

                    {(connectedInputs.context || connectedInputs.query) && (
                        <div className="mt-2 space-y-1">
                            {connectedInputs.context && (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-blue-600">CONTEXT: {'{context}'}</span>
                                </div>
                            )}
                            {connectedInputs.query && (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-purple-600">User Query: {'{query}'}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Temperature</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            step="0.05"
                            min="0"
                            max="2"
                            className="w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-gray-300"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0">
                            <ChevronUp size={12} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                            <ChevronDown size={12} className="text-gray-400 cursor-pointer hover:text-gray-600 -mt-1" />
                        </div>
                    </div>
                </div>

                <div className="mb-3 flex justify-between items-center">
                    <label className="text-xs font-medium text-gray-700">WebSearch Tool</label>
                    <label className="relative inline-block w-10 h-5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useWebSearch}
                            onChange={(e) => setUseWebSearch(e.target.checked)}
                            className="opacity-0 w-0 h-0 peer"
                        />
                        <span className="absolute top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-200 peer-checked:bg-green-500"></span>
                        <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 peer-checked:translate-x-5"></span>
                    </label>
                </div>

                {useWebSearch && (
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">SERF API</label>
                        <div className="relative">
                            <input
                                type={showSerpKey ? 'text' : 'password'}
                                value={serpApiKey}
                                onChange={(e) => setSerpApiKey(e.target.value)}
                                placeholder="Enter your SERP API key"
                                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-gray-300"
                            />
                            <button
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
                                onClick={() => setShowSerpKey(!showSerpKey)}
                            >
                                {showSerpKey ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute bottom-3 right-4 text-xs font-medium text-gray-600">
                Output
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="context"
                style={{
                    top: '35%',
                    transform: 'translateY(-50%)',
                    width: '10px',
                    height: '10px',
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '50%',
                    left: '-5px'
                }}
            />
            <div className="absolute left-2 text-[10px] font-medium text-blue-500" style={{ top: '35%', transform: 'translateY(-50%)' }}>
                Context
            </div>

            <Handle
                type="target"
                position={Position.Left}
                id="query"
                style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '10px',
                    height: '10px',
                    background: '#8b5cf6',
                    border: 'none',
                    borderRadius: '50%',
                    left: '-5px'
                }}
            />
            <div className="absolute left-2 text-[10px] font-medium text-purple-500" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                Query
            </div>

            <Handle
                type="source"
                position={Position.Right}
                id="output"
                style={{
                    bottom: '14px',
                    top: 'auto',
                    transform: 'translateY(0)',
                    width: '10px',
                    height: '10px',
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '50%',
                    right: '-5px'
                }}
            />
        </div>
    );
}

export default LLMEngineNode;
