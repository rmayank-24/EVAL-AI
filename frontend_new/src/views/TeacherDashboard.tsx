import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import AnalyticsView from './AnalyticsView';
import AssignmentGeneratorView from './AssignmentGeneratorView';
import AllSubmissionsView from './AllSubmissionsView';
import AssignmentManagementView from './AssignmentManagementView';
import { BarChart3, Sparkles, FileText, Settings, LucideProps } from 'lucide-react';
import React from 'react';

// Define a type for our tab objects
interface Tab {
  id: string;
  label: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  component: () => JSX.Element;
}

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  const tabs: Tab[] = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, component: AnalyticsView },
    { id: 'generator', label: 'AI Generator', icon: Sparkles, component: AssignmentGeneratorView },
    { id: 'submissions', label: 'Submissions', icon: FileText, component: AllSubmissionsView },
    { id: 'assignments', label: 'Assignments', icon: Settings, component: AssignmentManagementView },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <DashboardLayout title="Teacher Dashboard">
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
                      layoutId="underline"
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

export default TeacherDashboard;
