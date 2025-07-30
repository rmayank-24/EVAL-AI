import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';

// Import your page components
import LandingPage from './pages/LandingPage';
import ForTeachersPage from './pages/ForTeachersPage';
import ForStudentsPage from './pages/ForStudentsPage';
import ForAdminsPage from './pages/ForAdminsPage';
import LoginPage from './components/LoginPage';
import StudentDashboard from './views/StudentDashboard';
import TeacherDashboard from './views/TeacherDashboard';
import AdminDashboard from './views/AdminDashboard';
import LoadingSpinner from './components/LoadingSpinner';

// The 'children' prop has been given a type to resolve TypeScript errors.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F18]">
        <LoadingSpinner text="Authenticating..." />
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const DashboardRouter = () => {
  const { role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F18]">
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
                {/* Main marketing and info pages */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/for-teachers" element={<ForTeachersPage />} />
                <Route path="/for-students" element={<ForStudentsPage />} />
                <Route path="/for-admins" element={<ForAdminsPage />} />

                {/* <Route path="/for-admins" element={<ForAdminsPage />} /> */}
                
                {/* Auth pages */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<LoginPage />} />

                {/* Protected application dashboard */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  } 
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ConfirmationProvider>
    </NotificationProvider>
  );
}

export default App;
