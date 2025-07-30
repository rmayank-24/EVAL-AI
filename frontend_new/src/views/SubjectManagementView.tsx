import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, GraduationCap } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import apiService from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Define types for our state and data
interface Subject {
  id: string;
  name: string;
  description?: string;
  teacherUid: string;
  teacher?: { name: string; }; // Assuming teacher might be populated
  createdAt: string;
}

interface User {
  uid: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
}

interface NotificationContextType {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

interface ConfirmationContextType {
    confirm: (options: { title: string; message: string; confirmText?: string; isDestructive?: boolean; }) => Promise<boolean>;
}

const SubjectManagementView = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '', teacherUid: '' });
  const [creating, setCreating] = useState(false);
  const { showError, showSuccess } = useNotification() as NotificationContextType;
  const { confirm } = useConfirmation() as ConfirmationContextType;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectsData, usersData] = await Promise.all([
        apiService.getSubjects(),
        apiService.getUsers()
      ]);
      setSubjects(subjectsData);
      setUsers(usersData);
    } catch (error) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim() || !newSubject.teacherUid) {
      showError('Please enter a subject name and select a teacher');
      return;
    }
    setCreating(true);
    try {
      await apiService.createSubject(newSubject.name, newSubject.description, newSubject.teacherUid);
      showSuccess('Subject created successfully!');
      setNewSubject({ name: '', description: '', teacherUid: '' });
      setShowCreateForm(false);
      fetchData();
    } catch (error) {
      showError('Failed to create subject');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    const confirmed = await confirm({
      title: 'Delete Subject',
      message: `Are you sure you want to delete "${subjectName}"? This will also delete all related assignments and submissions.`,
      confirmText: 'Delete',
      isDestructive: true,
    });
    if (confirmed) {
      try {
        await apiService.deleteSubject(subjectId);
        showSuccess('Subject deleted successfully!');
        fetchData();
      } catch (error) {
        showError('Failed to delete subject');
      }
    }
  };

  const teachers = users.filter(user => user.role === 'teacher');
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner text="Loading subjects..." /></div>;
  }

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Subjects" value={subjects.length} icon={BookOpen} color="blue" />
        <StatCard title="Available Teachers" value={teachers.length} icon={GraduationCap} color="green" />
        <StatCard title="Avg Subjects/Teacher" value={teachers.length > 0 ? (subjects.length / teachers.length).toFixed(1) : '0'} icon={BookOpen} color="purple" />
      </motion.div>

      <div className="bg-gray-900/30 border border-white/10 rounded-xl backdrop-blur-lg">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white font-heading">Subject Management</h2>
              <p className="text-gray-400 mt-1 font-body">Create and manage subjects</p>
            </div>
            <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-mono text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Subject
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showCreateForm && (
            <motion.div 
              className="p-6 bg-gray-800/20 border-b border-white/10"
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
            >
              <h3 className="text-lg font-medium text-white mb-4 font-mono">Create New Subject</h3>
              <form onSubmit={handleCreateSubject} className="space-y-4">
                {/* Redesigned Form Fields */}
                <input type="text" value={newSubject.name} onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white" placeholder="Subject Name *" />
                <select value={newSubject.teacherUid} onChange={(e) => setNewSubject(prev => ({ ...prev, teacherUid: e.target.value }))} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white">
                  <option value="">Assign Teacher *</option>
                  {teachers.map((teacher) => <option key={teacher.uid} value={teacher.uid} className="bg-gray-800">{teacher.email}</option>)}
                </select>
                <textarea value={newSubject.description} onChange={(e) => setNewSubject(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white" placeholder="Description" />
                <div className="flex space-x-3">
                  <button type="submit" disabled={creating} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-mono">{creating ? <LoadingSpinner size="small" text="Creating..." /> : 'Create'}</button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg font-mono">Cancel</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          {subjects.length === 0 ? (
            <div className="text-center py-12"><BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" /><h3 className="text-lg font-medium text-white mb-2 font-mono">No subjects created yet</h3><p className="text-gray-400 font-body">Create your first subject to get started.</p></div>
          ) : (
            <table className="min-w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants}>
                {subjects.map((subject) => (
                  <motion.tr key={subject.id} className="border-b border-white/10 hover:bg-gray-800/40 transition-colors" variants={itemVariants}>
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-200 font-mono">{subject.name}</div>{subject.description && <div className="text-sm text-gray-400 font-body">{subject.description}</div>}</td>
                    <td className="px-6 py-4"><div className="flex items-center"><GraduationCap className="w-4 h-4 text-green-400 mr-2" /><span className="text-sm text-gray-300 font-mono">{users.find(u => u.uid === subject.teacherUid)?.email || 'N/A'}</span></div></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-400 font-mono">{subject.createdAt ? new Date(subject.createdAt).toLocaleDateString() : 'N/A'}</span></td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDeleteSubject(subject.id, subject.name)} className="flex items-center px-3 py-1 text-sm text-red-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors font-mono">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SubjectManagementView;
