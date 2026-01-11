import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chatApi } from '../services/api';

export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async ({ query, workflowId, sessionId, workflowConfig }) => {
        const response = await chatApi.execute({
            query,
            workflow_id: workflowId,
            session_id: sessionId,
            workflow_config: workflowConfig,
        });
        return response;
    }
);

export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async (sessionId) => {
        const response = await chatApi.getMessages(sessionId);
        return { messages: response, sessionId };
    }
);

export const fetchLatestSession = createAsyncThunk(
    'chat/fetchLatestSession',
    async (workflowId, { dispatch }) => {
        try {
            const sessions = await chatApi.getSessions(workflowId);
            if (sessions && sessions.length > 0) {
                const latestSessionId = sessions[0].id;
                await dispatch(fetchMessages(latestSessionId));
                return latestSessionId;
            }
        } catch (error) {
            console.error('Error fetching latest session:', error);
        }
        return null;
    }
);

const initialState = {
    isOpen: false,
    messages: [],
    sessionId: null,
    isLoading: false,
    error: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        openChat: (state) => {
            state.isOpen = true;
        },
        closeChat: (state) => {
            state.isOpen = false;
        },
        toggleChat: (state) => {
            state.isOpen = !state.isOpen;
        },
        clearMessages: (state) => {
            state.messages = [];
            state.sessionId = null;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendMessage.pending, (state, action) => {
                state.isLoading = true;
                state.messages.push({
                    id: Date.now().toString(),
                    role: 'user',
                    content: action.meta.arg.query,
                    created_at: new Date().toISOString(),
                });
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.isLoading = false;
                state.sessionId = action.payload.session_id;
                state.messages.push({
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: action.payload.response,
                    created_at: new Date().toISOString(),
                });
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message;
                state.messages.push({
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Sorry, there was an error processing your request.',
                    created_at: new Date().toISOString(),
                });
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.messages = action.payload.messages;
                state.sessionId = action.payload.sessionId;
            })
            .addCase(fetchLatestSession.fulfilled, (state, action) => {
                if (action.payload) {
                    state.sessionId = action.payload;
                }
            });
    },
});

export const {
    openChat,
    closeChat,
    toggleChat,
    clearMessages,
    addMessage,
    clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
