import axios from 'axios';
import { store } from '../store';
import { logoutUser } from '../store/authSlice';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const state = store.getState();
        const token = state.auth.token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token is invalid or expired, logout user
            store.dispatch(logoutUser());
        }
        return Promise.reject(error);
    }
);

// Workflow API
export const workflowApi = {
    list: async () => {
        const response = await api.get('/workflows/');
        return response.data;
    },

    get: async (id) => {
        const response = await api.get(`/workflows/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/workflows/', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/workflows/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/workflows/${id}`);
        return response.data;
    },

    validate: async (data) => {
        const response = await api.post('/workflows/validate', data);
        return response.data;
    },
};

// Document API
export const documentApi = {
    upload: async (formData) => {
        const response = await api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    list: async (workflowId = null) => {
        const params = workflowId ? { workflow_id: workflowId } : {};
        const response = await api.get('/documents/', { params });
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/documents/${id}`);
        return response.data;
    },
};

// Chat API
export const chatApi = {
    execute: async (data) => {
        const response = await api.post('/chat/execute', data);
        return response.data;
    },

    getSessions: async (workflowId) => {
        const response = await api.get(`/chat/sessions/${workflowId}`);
        return response.data;
    },

    getMessages: async (sessionId) => {
        const response = await api.get(`/chat/messages/${sessionId}`);
        return response.data;
    },
};

export default api;
