import { Handle, Position } from '@xyflow/react';
import { FileInput, Settings } from 'lucide-react';

function UserQueryNode({ data, selected }) {
    return (
        <div className={`w-[280px] bg-white rounded-2xl border border-gray-200 shadow-lg overflow-visible relative ${selected ? 'border-gray-300 shadow-xl' : ''}`}>
            <div className="flex items-center gap-3 px-5 py-4">
                <FileInput size={20} strokeWidth={1.5} className="text-gray-700" />
                <span className="font-semibold text-base text-gray-900 flex-1">User Query</span>
                <Settings size={18} strokeWidth={1.5} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 px-5 py-3">
                <span className="text-sm text-gray-800">Enter point for querys</span>
            </div>
            <div className="p-5 pb-8">
                <label className="block text-sm font-medium text-gray-800 mb-2">User Query</label>
                <textarea
                    placeholder="Write your query here"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none bg-white focus:outline-none focus:border-gray-300 placeholder:text-gray-400"
                />
            </div>

            <div className="absolute bottom-4 right-5 text-sm font-medium text-gray-600">
                Query
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="query"
                style={{
                    bottom: '18px',
                    top: 'auto',
                    transform: 'translateY(0)',
                    width: '12px',
                    height: '12px',
                    background: '#fbbf24',
                    border: 'none',
                    borderRadius: '50%',
                    right: '-6px'
                }}
            />
        </div>
    );
}

export default UserQueryNode;
