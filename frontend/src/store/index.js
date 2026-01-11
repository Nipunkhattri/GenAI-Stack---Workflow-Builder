import { configureStore } from '@reduxjs/toolkit';
import workflowReducer from './workflowSlice';
import chatReducer from './chatSlice';
import authReducer from './authSlice';

export const store = configureStore({
    reducer: {
        workflow: workflowReducer,
        chat: chatReducer,
        auth: authReducer,
    },
});

export default store;
