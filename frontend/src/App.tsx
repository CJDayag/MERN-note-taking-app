import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './index.css';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from '@/pages/auth/login';
import RegisterPage from '@/pages/auth/register';
import Dashboard from '@/pages/Dashboard';
import ProfilePage from '@/pages/auth/profile';
import config from '@/config';
import CreateNote from '@/pages/CreateNote';
import ArchivedNotes from '@/pages/ArchivedNotes';
import ViewNotes from '@/pages/ViewNotes';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/profile`, {
          ...config.defaultFetchOptions,
        });
        
        setIsAuthenticated(response.ok);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (isAuthenticated === null) {
      // Still checking auth status
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    return <>{children}</>;
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notes" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notes/new" 
          element={
            <ProtectedRoute>
              <CreateNote />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notes/archived" 
          element={
            <ProtectedRoute>
              <ArchivedNotes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notes/:id" 
          element={
            <ProtectedRoute>
              <ViewNotes />
            </ProtectedRoute>
          } 
        />
        
        {/* Add other protected routes as needed */}
      </Routes>
      <Toaster position='top-right' />
    </Router>
  );
}

export default App;
