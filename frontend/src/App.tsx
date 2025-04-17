import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
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
  
  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/profile`, {
        ...config.defaultFetchOptions,
        credentials: 'include', // make sure cookies are sent
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User authenticated:', userData);
        setIsAuthenticated(true);
        // You can also store user data in state if needed
        // setUserData(userData);
        return true;
      } else {
        console.log('Authentication failed');
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      return false;
    }
  };
  
  // Then in your onLogin prop passed to LoginPage
  const handleLogin = async () => {
    const success = await checkAuthStatus();
    return success;
  };

  // Protected route component (without redundant authentication check)
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (isAuthenticated === null) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    // Redirect unauthenticated users to the login page
    if (!isAuthenticated) {
      return <Navigate to="/" />;
    }

    return <>{children}</>;
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
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
