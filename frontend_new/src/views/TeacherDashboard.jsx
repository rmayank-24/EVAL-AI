import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import AnalyticsView from './AnalyticsView';
import AssignmentGeneratorView from './AssignmentGeneratorView';
import AllSubmissionsView from './AllSubmissionsView';
import AssignmentManagementView from './AssignmentManagementView';
import { BarChart3, Sparkles, FileText, Settings } from 'lucide-react';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, component: AnalyticsView },
    { id: 'generator', label: 'AI Generator', icon: Sparkles, component: AssignmentGeneratorView },
    { id: 'submissions', label: 'Submissions', icon: FileText, component: AllSubmissionsView },
    { id: 'assignments', label: 'Assignments', icon: Settings, component: AssignmentManagementView },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <DashboardLayout title="Teacher Dashboard">
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
                      ? 'border-blue-500 text-blue-600'
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

export default TeacherDashboard;