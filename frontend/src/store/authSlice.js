import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const loadUserFromStorage = () => {
    try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            return { token, user: JSON.parse(user) };
        }
    } catch (error) {
        console.error('Error loading user from storage:', error);
    }
    return { token: null, user: null };
};

const { token: initialToken, user: initialUser } = loadUserFromStorage();

const initialState = {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken,
    loading: false,
    error: null,
};

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'Registration failed');
        }
    }
);

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/login', credentials);
            const { access_token, token_type } = response.data;
            
            localStorage.setItem('token', access_token);
            
            const userResponse = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            
            localStorage.setItem('user', JSON.stringify(userResponse.data));
            
            return {
                token: access_token,
                user: userResponse.data,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'Login failed');
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
    }
);

export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async (_, { rejectWithValue, getState }) => {
        try {
            const { token } = getState().auth;
            if (!token) {
                return rejectWithValue('No token found');
            }
            
            const response = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            localStorage.setItem('user', JSON.stringify(response.data));
            return response.data;
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return rejectWithValue(error.response?.data?.detail || 'Failed to get user');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.token = null;
                state.user = null;
                state.error = action.payload;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.isAuthenticated = false;
                state.token = null;
                state.user = null;
                state.error = null;
            })
            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(getCurrentUser.rejected, (state) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.token = null;
                state.user = null;
            });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
