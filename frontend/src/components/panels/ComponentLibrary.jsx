import { Type, Sparkles, Database, FileOutput, GripVertical } from 'lucide-react';

const components = [
    { type: 'userQuery', label: 'User Query', icon: Type },
    { type: 'llmEngine', label: 'LLM (OpenAI)', icon: Sparkles },
    { type: 'knowledgeBase', label: 'Knowledge Base', icon: Database },
    { type: 'output', label: 'Output', icon: FileOutput },
];

function ComponentLibrary() {
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="bg-white border-r border-gray-200 flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-200 font-semibold text-sm text-gray-900">
                <span>Components</span>
            </div>
            <div className="p-3 flex flex-col gap-2">
                {components.map((component) => {
                    const Icon = component.icon;
                    return (
                        <div
                            key={component.type}
                            className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg cursor-grab hover:border-green-500 hover:bg-green-50 transition-all group"
                            draggable
                            onDragStart={(e) => onDragStart(e, component.type)}
                        >
                            <div className="flex items-center gap-2">
                                <Icon size={14} className="text-gray-600 group-hover:text-green-600" />
                                <span className="text-xs font-medium text-gray-700 group-hover:text-green-700">{component.label}</span>
                            </div>
                            <GripVertical size={14} className="text-gray-400 group-hover:text-green-500" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ComponentLibrary;
