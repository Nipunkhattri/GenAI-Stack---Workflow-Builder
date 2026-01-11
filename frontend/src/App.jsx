import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Dashboard from './pages/Dashboard'
import WorkflowEditor from './pages/WorkflowEditor'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    const { isAuthenticated } = useSelector((state) => state.auth);

    return (
        <Routes>
            <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
            />
            <Route 
                path="/register" 
                element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
            />

            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/workflow/new" 
                element={
                    <ProtectedRoute>
                        <WorkflowEditor />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/workflow/:id" 
                element={
                    <ProtectedRoute>
                        <WorkflowEditor />
                    </ProtectedRoute>
                } 
            />
        </Routes>
    )
}

export default App
