import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import NotificationBell from './NotificationBell';

const DashboardLayout = ({ children, title }) => {
  const { user, role, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell />
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
                    {role?.charAt(0).toUpperCase() + role?.slice(1)}
                  </span>
                </div>
                
                <div className="bg-gray-100 p-2 rounded-full">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;