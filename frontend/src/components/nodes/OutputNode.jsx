import { Handle, Position, useReactFlow } from '@xyflow/react';
import { FileOutput, Settings } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

function OutputNode({ id, data, selected }) {
    const { setNodes } = useReactFlow();
    const [formattingPrompt, setFormattingPrompt] = useState(data?.config?.formatting_prompt || '');

    const updateNodeData = useCallback(() => {
        setNodes(nodes => nodes.map(node => {
            if (node.id === id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        config: {
                            ...node.data.config,
                            formatting_prompt: formattingPrompt
                        }
                    }
                };
            }
            return node;
        }));
    }, [setNodes, id, formattingPrompt]);

    useEffect(() => {
        const timer = setTimeout(updateNodeData, 500);
        return () => clearTimeout(timer);
    }, [formattingPrompt, updateNodeData]);

    return (
        <div className={`w-[280px] bg-white rounded-2xl border border-gray-200 shadow-lg overflow-visible relative ${selected ? 'border-gray-300 shadow-xl' : ''}`}>
            <div className="flex items-center gap-3 px-4 py-3.5">
                <FileOutput size={18} className="text-gray-700" />
                <span className="font-semibold text-sm text-gray-900 flex-1">Structured Output</span>
                <Settings size={16} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>

            <div className="bg-[#eff6ff] px-4 py-2">
                <span className="text-xs text-black">Format the final response</span>
            </div>
            <div className="p-4 pb-6">
                <div className="mb-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Final Result</label>
                    <div className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-xs text-gray-400 bg-gray-50 italic">
                        Output will be generated in a structured format...
                    </div>
                </div>
            </div>

            <div className="absolute bottom-3 left-4 text-xs font-medium text-gray-600">
                Output
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="output"
                style={{
                    bottom: '14px',
                    top: 'auto',
                    transform: 'translateY(0)',
                    width: '10px',
                    height: '10px',
                    background: '#f97316',
                    border: 'none',
                    borderRadius: '50%',
                    left: '-5px'
                }}
            />
        </div>
    );
}

export default OutputNode;
