import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import LoginPage from './components/LoginPage';
import StudentDashboard from './views/StudentDashboard';
import TeacherDashboard from './views/TeacherDashboard';
import AdminDashboard from './views/AdminDashboard';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const DashboardRouter = () => {
  const { role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <NotificationProvider>
      <ConfirmationProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ConfirmationProvider>
    </NotificationProvider>
  );
}

export default App;