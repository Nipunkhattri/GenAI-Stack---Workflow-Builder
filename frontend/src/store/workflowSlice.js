import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workflowApi } from '../services/api';

export const fetchWorkflows = createAsyncThunk(
    'workflow/fetchWorkflows',
    async () => {
        const response = await workflowApi.list();
        return response;
    }
);

export const fetchWorkflow = createAsyncThunk(
    'workflow/fetchWorkflow',
    async (id) => {
        const response = await workflowApi.get(id);
        return response;
    }
);

export const loadWorkflow = fetchWorkflow;

export const saveWorkflow = createAsyncThunk(
    'workflow/saveWorkflow',
    async ({ id, data }) => {
        if (id) {
            return await workflowApi.update(id, data);
        }
        return await workflowApi.create(data);
    }
);

export const validateWorkflow = createAsyncThunk(
    'workflow/validateWorkflow',
    async (data) => {
        return await workflowApi.validate(data);
    }
);

export const deleteWorkflow = createAsyncThunk(
    'workflow/deleteWorkflow',
    async (id) => {
        await workflowApi.delete(id);
        return id;
    }
);

const initialState = {
    workflows: [],
    workflowsLoading: false,
    currentWorkflow: null,
    nodes: [],
    edges: [],
    selectedNode: null,
    isValid: false,
    validationResult: null,
    isBuilt: false,
    loading: false,
    saving: false,
    error: null,
};

const workflowSlice = createSlice({
    name: 'workflow',
    initialState,
    reducers: {
        setNodes: (state, action) => {
            state.nodes = action.payload;
            state.isBuilt = false;
        },
        setEdges: (state, action) => {
            state.edges = action.payload;
            state.isBuilt = false;
        },
        addNode: (state, action) => {
            state.nodes.push(action.payload);
            state.isBuilt = false;
        },
        updateNode: (state, action) => {
            const { id, data } = action.payload;
            const nodeIndex = state.nodes.findIndex(n => n.id === id);
            if (nodeIndex !== -1) {
                state.nodes[nodeIndex] = { ...state.nodes[nodeIndex], ...data };
            }
            state.isBuilt = false;
        },
        updateNodeConfig: (state, action) => {
            const { nodeId, config } = action.payload;
            const nodeIndex = state.nodes.findIndex(n => n.id === nodeId);
            if (nodeIndex !== -1) {
                state.nodes[nodeIndex].data.config = {
                    ...state.nodes[nodeIndex].data.config,
                    ...config,
                };
            }
            state.isBuilt = false;
        },
        removeNode: (state, action) => {
            const nodeId = action.payload;
            state.nodes = state.nodes.filter(n => n.id !== nodeId);
            state.edges = state.edges.filter(
                e => e.source !== nodeId && e.target !== nodeId
            );
            if (state.selectedNode === nodeId) {
                state.selectedNode = null;
            }
            state.isBuilt = false;
        },
        addEdge: (state, action) => {
            state.edges.push(action.payload);
            state.isBuilt = false;
        },
        removeEdge: (state, action) => {
            state.edges = state.edges.filter(e => e.id !== action.payload);
            state.isBuilt = false;
        },
        setSelectedNode: (state, action) => {
            state.selectedNode = action.payload;
        },
        setBuilt: (state, action) => {
            state.isBuilt = action.payload;
        },
        resetWorkflow: (state) => {
            state.currentWorkflow = null;
            state.nodes = [];
            state.edges = [];
            state.selectedNode = null;
            state.isValid = false;
            state.validationResult = null;
            state.isBuilt = false;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkflows.pending, (state) => {
                state.workflowsLoading = true;
                state.error = null;
            })
            .addCase(fetchWorkflows.fulfilled, (state, action) => {
                state.workflowsLoading = false;
                state.workflows = action.payload;
                state.error = null;
            })
            .addCase(fetchWorkflows.rejected, (state, action) => {
                state.workflowsLoading = false;
                state.error = action.error.message;
            })
            .addCase(fetchWorkflow.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkflow.fulfilled, (state, action) => {
                state.loading = false;
                state.currentWorkflow = action.payload;
                state.nodes = action.payload.nodes || [];
                state.edges = action.payload.edges || [];
                state.error = null;
            })
            .addCase(fetchWorkflow.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(saveWorkflow.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(saveWorkflow.fulfilled, (state, action) => {
                state.saving = false;
                state.currentWorkflow = action.payload;
                state.error = null;
            })
            .addCase(saveWorkflow.rejected, (state, action) => {
                state.saving = false;
                state.error = action.error.message;
            })
            .addCase(validateWorkflow.fulfilled, (state, action) => {
                state.validationResult = action.payload;
                state.isValid = action.payload.is_valid;
            })
            .addCase(deleteWorkflow.fulfilled, (state, action) => {
                state.workflows = state.workflows.filter(w => w.id !== action.payload);
            });
    },
});

export const {
    setNodes,
    setEdges,
    addNode,
    updateNode,
    updateNodeConfig,
    removeNode,
    addEdge,
    removeEdge,
    setSelectedNode,
    setBuilt,
    resetWorkflow,
    clearError,
} = workflowSlice.actions;

export default workflowSlice.reducer;
