import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import AnalyticsView from './AnalyticsView';
import UserManagementView from './UserManagementView';
import SubjectManagementView from './SubjectManagementView';
import { BarChart3, Users, BookOpen } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, component: AnalyticsView },
    { id: 'users', label: 'User Management', icon: Users, component: UserManagementView },
    { id: 'subjects', label: 'Subject Management', icon: BookOpen, component: SubjectManagementView },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;