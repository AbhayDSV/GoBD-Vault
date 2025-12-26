import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Documents from './pages/Documents';
import DocumentViewer from './pages/DocumentViewer';
import Audit from './pages/Audit';
import Export from './pages/Export';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                <div className="app-layout">
                                    <Navbar />
                                    <main className="app-main">
                                        <Routes>
                                            <Route path="/" element={<Dashboard />} />
                                            <Route path="/upload" element={<Upload />} />
                                            <Route path="/documents" element={<Documents />} />
                                            <Route path="/documents/:id" element={<DocumentViewer />} />
                                            <Route path="/audit" element={<Audit />} />
                                            <Route path="/export" element={<Export />} />
                                            <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                    </main>
                                </div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
