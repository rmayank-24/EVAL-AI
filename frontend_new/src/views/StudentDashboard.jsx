import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import EvaluatorPage from './EvaluatorPage';
import HistoryPage from './HistoryPage';
import { FileText, History } from 'lucide-react';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('submit');

  const tabs = [
    { id: 'submit', label: 'Submit Work', icon: FileText, component: EvaluatorPage },
    { id: 'history', label: 'My Submissions', icon: History, component: HistoryPage },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <DashboardLayout title="Student Dashboard">
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

export default StudentDashboard;