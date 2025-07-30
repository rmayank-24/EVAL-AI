import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import EvaluatorPage from './EvaluatorPage';
import HistoryPage from './HistoryPage';
import { FileText, History, LucideProps } from 'lucide-react';
import React from 'react';

// Define a type for our tab objects
interface Tab {
  id: string;
  label: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  component: () => JSX.Element;
}

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('submit');

  const tabs: Tab[] = [
    { id: 'submit', label: 'Submit Work', icon: FileText, component: EvaluatorPage },
    { id: 'history', label: 'My Submissions', icon: History, component: HistoryPage },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="space-y-8">
        <div className="border-b border-white/10">
          <nav className="flex space-x-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center py-3 px-4 font-mono font-medium text-sm transition-colors duration-300 ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" 
                      layoutId="student-underline"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
