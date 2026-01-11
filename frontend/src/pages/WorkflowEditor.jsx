import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ReactFlow,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from '../components/nodes';
import ComponentLibrary from '../components/panels/ComponentLibrary';
import ZoomControls from '../components/panels/ZoomControls';
import ChatModal from '../components/chat/ChatModal';
import { Save, Play, MessageCircle, Settings, LogOut } from 'lucide-react';
import { saveWorkflow, loadWorkflow } from '../store/workflowSlice';
import { logoutUser } from '../store/authSlice';
import { clearMessages, fetchLatestSession } from '../store/chatSlice';
import toast from 'react-hot-toast';

const initialNodes = [];
const initialEdges = [];

function WorkflowEditorContent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const reactFlowWrapper = useRef(null);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [workflowName, setWorkflowName] = useState('Untitled Stack');

    const { currentWorkflow } = useSelector((state) => state.workflow);
    const { user } = useSelector((state) => state.auth);
    const { sessionId } = useSelector((state) => state.chat);

    useEffect(() => {
        if (id && id !== 'new') {
            dispatch(loadWorkflow(id));
        }
    }, [id, dispatch]);

    useEffect(() => {
        if (currentWorkflow) {
            setWorkflowName(currentWorkflow.name || 'Untitled Stack');
            if (currentWorkflow.nodes) {
                setNodes(currentWorkflow.nodes);
            }
            if (currentWorkflow.edges) {
                setEdges(currentWorkflow.edges);
            }
        }
    }, [currentWorkflow, setNodes, setEdges]);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#22c55e' } }, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow');
            if (!type || !reactFlowInstance) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: `${type}_${Date.now()}`,
                type,
                position,
                data: { label: type, config: {} },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const handleSave = async () => {
        const workflowId = id !== 'new' ? id : undefined;
        const data = {
            name: workflowName,
            nodes,
            edges,
        };
        try {
            await dispatch(saveWorkflow({ id: workflowId, data }));
            toast.success('Workflow saved successfully!');
        } catch (error) {
            toast.error('Failed to save workflow');
        }
    };

    const handleBuild = () => {
        const llmNode = nodes.find(node => node.type === 'llmEngine');
        if (llmNode && !llmNode.data?.config?.api_key) {
            toast.error('API key not added. Please add your API key in LLM node.');
            return;
        }

        const kbNode = nodes.find(node => node.type === 'knowledgeBase');
        if (kbNode && !kbNode.data?.config?.file) {
            toast.error('PDF not uploaded. Please upload a file in Knowledge Base node.');
            return;
        }

        dispatch(clearMessages());
        setShowChat(true);
    };

    const goBack = () => {
        navigate('/');
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        toast.success('Logged out successfully');
    };

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            <header className="flex justify-between items-center px-5 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5 font-semibold text-base cursor-pointer" onClick={goBack}>
                        <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">G</div>
                        <span>GenAI Stack</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 px-3.5 py-2 bg-transparent text-gray-900 border border-gray-200 rounded-md font-medium text-[13px] cursor-pointer transition-all hover:bg-gray-100 hover:border-gray-300" onClick={handleSave}>
                        <Save size={16} />
                        Save
                    </button>
                    <span className="text-sm text-gray-600">
                        {user?.username || user?.email}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
                    <div className="flex justify-between items-center px-4 pt-4 pb-3 font-semibold text-sm border-b border-gray-200">
                        <span>{workflowName}</span>
                        <Settings size={16} className="text-gray-500 cursor-pointer hover:text-gray-900" />
                    </div>
                    <ComponentLibrary />
                </aside>

                <main className="flex-1 relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        fitView
                        snapToGrid
                        snapGrid={[15, 15]}
                        deleteKeyCode={['Backspace', 'Delete']}
                        nodesDraggable={true}
                        nodesConnectable={true}
                        nodesFocusable={true}
                        edgesFocusable={true}
                    >
                        <Background gap={20} size={1} color="#e5e5e5" variant="dots" />
                        <ZoomControls />

                        {nodes.length === 0 && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-gray-500 pointer-events-none z-[5]">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md">
                                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                        <rect x="8" y="12" width="32" height="24" rx="2" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2" />
                                        <path d="M20 24h8M24 20v8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium">Drag & drop to get started</p>
                            </div>
                        )}
                    </ReactFlow>

                    <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-10">
                        <div className="group flex items-center gap-2">
                            {nodes.length > 0 && (
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold text-gray-800">
                                    Build Stack
                                </span>
                            )}
                            <button
                                className={`w-14 h-14 border-0 rounded-full flex items-center justify-center transition-all ${nodes.length > 0
                                    ? 'bg-green-500 text-white cursor-pointer shadow-[0_4px_12px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:scale-105'
                                    : 'bg-green-200 text-green-400 cursor-not-allowed'
                                    }`}
                                onClick={handleBuild}
                                disabled={nodes.length === 0}
                            >
                                <Play size={24} fill="currentColor" />
                            </button>
                        </div>

                        <button
                            className={`w-14 h-14 border-0 rounded-full flex items-center justify-center transition-all ${nodes.length > 0
                                ? 'bg-blue-500 text-white cursor-pointer shadow-[0_4px_12px_rgba(59,130,246,0.4)] hover:bg-blue-600 hover:scale-105'
                                : 'bg-blue-200 text-blue-400 cursor-not-allowed'
                                }`}
                            onClick={() => {
                                if (nodes.length > 0) {
                                    // If no session is active, try to resume the last one
                                    if (!sessionId && id !== 'new') {
                                        dispatch(fetchLatestSession(id));
                                    }
                                    setShowChat(true);
                                }
                            }}
                            disabled={nodes.length === 0}
                        >
                            <MessageCircle size={22} />
                        </button>
                    </div>
                </main>
            </div>

            {showChat && (
                <ChatModal
                    workflowId={id}
                    nodes={nodes}
                    edges={edges}
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    );
}

function WorkflowEditor() {
    return (
        <ReactFlowProvider>
            <WorkflowEditorContent />
        </ReactFlowProvider>
    );
}

export default WorkflowEditor;
