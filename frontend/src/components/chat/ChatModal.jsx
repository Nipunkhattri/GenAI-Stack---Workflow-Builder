import { useDispatch, useSelector } from 'react-redux';
import { X, Send, Bot } from 'lucide-react';
import { sendMessage, clearMessages } from '../../store/chatSlice';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useReactFlow } from '@xyflow/react';

function ChatModal({ workflowId, nodes: propNodes, edges: propEdges, onClose }) {
    const dispatch = useDispatch();
    const { messages, isLoading, sessionId } = useSelector((state) => state.chat);
    const [input, setInput] = useState('');

    // Access internal store to ensure we have the absolute latest data including custom node updates
    const { getNodes, getEdges } = useReactFlow();

    const handleSend = () => {
        if (!input.trim() || isLoading) return;

        // Use internal store nodes if available, otherwise fall back to props
        const currentNodes = getNodes ? getNodes() : propNodes;
        const currentEdges = getEdges ? getEdges() : propEdges;

        const workflowConfig = {
            nodes: currentNodes.map(n => ({
                id: n.id,
                type: n.type,
                data: n.data
            })),
            edges: currentEdges.map(e => ({
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle
            }))
        };

        dispatch(sendMessage({
            query: input.trim(),
            workflowId,
            sessionId,
            workflowConfig,
        }));
        setInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]">
            <div className="w-[90%] max-w-[1000px] h-[80vh] max-h-[600px] bg-white rounded-xl flex flex-col overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Bot size={18} className="text-green-600" />
                        </div>
                        <span className="font-semibold text-gray-800">GenAI Stack Chat</span>
                    </div>
                    <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-gray-400">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-2">
                                <Bot size={32} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-gray-900 font-medium mb-1">GenAI Assistant</h3>
                                <p className="text-sm">Ask anything about your documents or stack</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className="flex gap-4 group">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-green-100 text-green-600'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        <div className="text-xs font-bold">U</div>
                                    ) : (
                                        <Bot size={16} />
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="text-sm leading-relaxed text-gray-800">
                                        <ReactMarkdown
                                            components={{
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                                                li: ({ node, ...props }) => <li className="pl-1 marker:text-gray-500" {...props} />,
                                                strong: ({ node, ...props }) => <span className="font-bold text-gray-900" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600">
                                <Bot size={16} />
                            </div>
                            <span className="text-sm text-gray-400 py-1.5 italic">Thinking...</span>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-gray-100 bg-white">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-200 transition-all">
                        <input
                            type="text"
                            placeholder={isLoading ? "Thinking..." : "Send a message..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            className="flex-1 bg-transparent py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none disabled:opacity-50"
                        />
                        <button
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatModal;
