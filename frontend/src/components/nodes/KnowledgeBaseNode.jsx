import { Handle, Position, useReactFlow } from '@xyflow/react';
import { FileInput, Settings, Upload, Eye, EyeOff, ChevronDown, Trash2, Zap } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { documentApi } from '../../services/api';
import toast from 'react-hot-toast';

function KnowledgeBaseNode({ id, data, selected }) {
    const { setNodes } = useReactFlow();
    const { id: workflowId } = useParams();
    const [showApiKey, setShowApiKey] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(data?.config?.file || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [embeddingModel, setEmbeddingModel] = useState(data?.config?.embedding_model || 'text-embedding-3-small');
    const [apiKey, setApiKey] = useState(data?.config?.api_key || '');

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!workflowId || workflowId === 'new') {
            toast.error('Please save the workflow first before uploading a file');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        if (!apiKey) {
            toast.error('Please enter your API key before uploading a file');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('workflow_id', workflowId);
            formData.append('embedding_provider', getEmbeddingProvider(embeddingModel));
            formData.append('embedding_model', embeddingModel);
            formData.append('api_key', apiKey);

            // Response now includes file_path and collection_name
            const response = await documentApi.upload(formData);

            // Store the full file details, not just the raw File object
            setUploadedFile({
                name: response.filename,
                path: response.file_path,
                collection_name: response.collection_name,
                id: response.id
            });

            toast.loading('Building embeddings...', { id: loadingToast });
            await documentApi.buildEmbeddings({
                workflow_id: workflowId,
                embedding_provider: getEmbeddingProvider(embeddingModel),
                embedding_model: embeddingModel,
                api_key: apiKey
            });

            toast.success('File uploaded and embeddings created!', { id: loadingToast });
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to process file: ' + (error.response?.data?.detail || error.message), { id: loadingToast });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } finally {
            setUploading(false);
        }
    };

    const handleProcessEmbeddings = async () => {
        if (!uploadedFile || !apiKey) {
            toast.error('Missing file or API key');
            return;
        }

        setUploading(true);
        const loadingToast = toast.loading('Building embeddings...');

        try {
            await documentApi.buildEmbeddings({
                workflow_id: workflowId,
                embedding_provider: getEmbeddingProvider(embeddingModel),
                embedding_model: embeddingModel,
                api_key: apiKey
            });
            toast.success('Embeddings built successfully!', { id: loadingToast });
        } catch (error) {
            console.error('Embedding error:', error);
            toast.error('Failed to build embeddings: ' + (error.response?.data?.detail || error.message), { id: loadingToast });
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getEmbeddingProvider = (modelName) => {
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
                            embedding_provider: getEmbeddingProvider(embeddingModel),
                            embedding_model: embeddingModel,
                            api_key: apiKey,
                            file: uploadedFile,
                            file_path: uploadedFile?.path,
                            collection_name: uploadedFile?.collection_name
                        }
                    }
                };
            }
            return node;
        }));
    }, [setNodes, id, embeddingModel, apiKey, uploadedFile]);

    useEffect(() => {
        const timer = setTimeout(updateNodeData, 300);
        return () => clearTimeout(timer);
    }, [embeddingModel, apiKey, uploadedFile, updateNodeData]);

    return (
        <div className={`w-[280px] bg-white rounded-2xl border border-gray-200 shadow-lg overflow-visible relative ${selected ? 'border-gray-300 shadow-xl' : ''}`}>
            <div className="flex items-center gap-3 px-5 py-4">
                <FileInput size={20} strokeWidth={1.5} className="text-gray-700" />
                <span className="font-semibold text-base text-gray-900 flex-1">Knowledge Base</span>
                <Settings size={18} strokeWidth={1.5} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 px-5 py-3">
                <span className="text-sm text-gray-800">Let LLM search info in your file</span>
            </div>
            <div className="p-5 pb-8">
                <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-800 mb-2">File for Knowledge Base</label>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf,.txt,.doc,.docx"
                        className="hidden"
                    />

                    {uploadedFile ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between w-full px-4 py-3 bg-white border-2 border-dashed border-green-400 rounded-xl">
                                <span className="text-sm text-gray-700 truncate flex-1">
                                    {uploadedFile.name || (typeof uploadedFile === 'string' ? uploadedFile.split(/[/\\]/).pop() : 'Attached File')}
                                </span>
                                <button
                                    onClick={handleRemoveFile}
                                    className="ml-2 text-gray-400 hover:text-red-500 cursor-pointer"
                                    title="Remove file"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={`flex items-center justify-center gap-2 w-full py-4 bg-white border-2 border-dashed border-green-400 rounded-xl text-green-600 text-sm font-medium cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {uploading ? 'Uploading...' : 'Upload File'}
                            <Upload size={16} />
                        </button>
                    )}
                </div>

                <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-800 mb-2">Embedding Model</label>
                    <div className="relative">
                        <select
                            value={embeddingModel}
                            onChange={(e) => setEmbeddingModel(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white appearance-none pr-10 focus:outline-none focus:border-gray-300 cursor-pointer"
                        >
                            <optgroup label="OpenAI">
                                <option value="text-embedding-3-large">text-embedding-3-large</option>
                                <option value="text-embedding-3-small">text-embedding-3-small</option>
                                <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                            </optgroup>
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-800 mb-2">API Key</label>
                    <div className="relative">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-300"
                        />
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-transparent border-0 text-gray-400 cursor-pointer rounded hover:text-gray-600"
                            onClick={() => setShowApiKey(!showApiKey)}
                        >
                            {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 left-5 text-sm font-medium text-gray-600">
                Query
            </div>
            <div className="absolute bottom-4 right-5 text-sm font-medium text-gray-600">
                Context
            </div>

            <Handle
                type="target"
                position={Position.Left}
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
                    left: '-6px'
                }}
            />

            <Handle
                type="source"
                position={Position.Right}
                id="context"
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

export default KnowledgeBaseNode;
