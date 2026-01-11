import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkflows, deleteWorkflow } from '../store/workflowSlice';
import { logoutUser } from '../store/authSlice';
import { Plus, ExternalLink, X, LogOut, Trash2 } from 'lucide-react';
import { workflowApi } from '../services/api';
import toast from 'react-hot-toast';

function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { workflows = [], workflowsLoading, error } = useSelector((state) => state.workflow);
    const { user } = useSelector((state) => state.auth);
    const [showModal, setShowModal] = useState(false);
    const [newStack, setNewStack] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        dispatch(fetchWorkflows()).catch(err => {
            console.error('Failed to fetch workflows:', err);
        });
    }, [dispatch]);

    const handleNewStack = () => {
        setShowModal(true);
    };

    const handleCreateStack = async () => {
        if (!newStack.name.trim()) return;

        setCreating(true);
        try {
            const created = await workflowApi.create({
                name: newStack.name,
                description: newStack.description,
                nodes: [],
                edges: []
            });
            setShowModal(false);
            setNewStack({ name: '', description: '' });
            navigate(`/workflow/${created.id}`);
        } catch (error) {
            console.error('Failed to create stack:', error);
            toast.error('Failed to create stack. Make sure backend is running.');
        } finally {
            setCreating(false);
        }
    };

    const handleEditStack = (id) => {
        navigate(`/workflow/${id}`);
    };

    const handleDeleteStack = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this stack? This action cannot be undone.')) {
            try {
                await dispatch(deleteWorkflow(id)).unwrap();
                toast.success('Stack deleted');
            } catch (error) {
                console.error('Failed to delete stack:', error);
                toast.error('Failed to delete stack');
            }
        }
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        toast.success('Logged out successfully');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="flex justify-between items-center px-6 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2.5 font-semibold text-base cursor-pointer">
                    <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">G</div>
                    <span>GenAI Stack</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                        {user?.username || user?.email}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </header>

            <main className="px-10 py-6 max-w-[1400px] mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">My Stacks</h1>
                    <button className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white border-0 rounded-md font-medium text-sm cursor-pointer transition-colors hover:bg-green-600" onClick={handleNewStack}>
                        <Plus size={16} />
                        New Stack
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-600 px-4 py-3 rounded-md mb-5 text-sm">
                        Error loading workflows. Make sure backend is running at http://localhost:8000
                    </div>
                )}

                {workflowsLoading ? (
                    <div className="text-center py-15 text-gray-500">Loading workflows...</div>
                ) : !workflows || workflows.length === 0 ? (
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="bg-white px-10 py-8 rounded-xl shadow-sm text-left max-w-[400px]">
                            <h2 className="text-xl font-semibold mb-2 text-gray-900">Create New Stack</h2>
                            <p className="text-sm text-gray-600 mb-5 leading-relaxed">Start building your generative AI apps with our essential tools and frameworks</p>
                            <button className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white border-0 rounded-md font-medium text-sm cursor-pointer transition-colors hover:bg-green-600" onClick={handleNewStack}>
                                <Plus size={16} />
                                New Stack
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
                        {workflows.map((workflow) => (
                            <div key={workflow.id} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                                <h3 className="text-[15px] font-semibold mb-1 text-gray-900">{workflow.name}</h3>
                                <p className="text-[13px] text-gray-500 mb-4">{workflow.description || 'No description'}</p>
                                <div className="flex gap-2">
                                    <button
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-transparent text-gray-900 border border-gray-200 rounded-md font-medium text-[13px] cursor-pointer transition-all hover:bg-gray-100 hover:border-gray-300"
                                        onClick={() => handleEditStack(workflow.id)}
                                    >
                                        Edit Stack
                                        <ExternalLink size={14} />
                                    </button>
                                    <button
                                        className="flex items-center justify-center px-3 py-2 bg-transparent text-red-600 border border-gray-200 rounded-md font-medium text-[13px] cursor-pointer transition-all hover:bg-red-50 hover:border-red-200"
                                        onClick={(e) => handleDeleteStack(e, workflow.id)}
                                        title="Delete Stack"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl w-[90%] max-w-[480px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200">
                            <h3 className="text-base font-semibold">Create New Stack</h3>
                            <button className="p-1 bg-transparent border-0 text-gray-500 cursor-pointer rounded hover:bg-gray-100 hover:text-gray-900" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-5">
                                <label className="block text-[13px] font-medium text-gray-600 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={newStack.name}
                                    onChange={(e) => setNewStack({ ...newStack, name: e.target.value })}
                                    placeholder="Enter stack name"
                                    autoFocus
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm font-inherit transition-colors focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div className="mb-0">
                                <label className="block text-[13px] font-medium text-gray-600 mb-2">Description</label>
                                <textarea
                                    value={newStack.description}
                                    onChange={(e) => setNewStack({ ...newStack, description: e.target.value })}
                                    placeholder="Enter description (optional)"
                                    rows={4}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm font-inherit resize-vertical min-h-[80px] transition-colors focus:outline-none focus:border-green-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                            <button className="px-4 py-2 bg-transparent text-gray-600 border-0 font-medium text-sm cursor-pointer hover:text-gray-900" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white border-0 rounded-md font-medium text-sm cursor-pointer transition-colors hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                onClick={handleCreateStack}
                                disabled={!newStack.name.trim() || creating}
                            >
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
