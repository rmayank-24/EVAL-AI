import { useState, useEffect } from 'react';
import { Plus, Eye, EyeOff, Trash2, FileText } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import apiService from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Define types for our state and data
interface Subject {
  id: string;
  name: string;
}

interface RubricItem {
  criterion: string;
  points: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  rubric: RubricItem[];
  showDetailsToStudent: boolean;
}

interface NotificationContextType {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

interface ConfirmationContextType {
    confirm: (options: { title: string; message: string; confirmText?: string; isDestructive?: boolean; }) => Promise<boolean>;
}

const AssignmentManagementView = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    rubric: [{ criterion: '', points: '' }],
    showDetailsToStudent: false,
  });
  const [creating, setCreating] = useState(false);
  const { showError, showSuccess } = useNotification() as NotificationContextType;
  const { confirm } = useConfirmation() as ConfirmationContextType;

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchAssignments();
    } else {
      setAssignments([]);
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const data = await apiService.getSubjects();
      setSubjects(data);
    } catch (error) {
      showError('Failed to fetch subjects');
    }
  };

  const fetchAssignments = async () => {
    if (!selectedSubject) return;
    setLoadingAssignments(true);
    try {
      const data = await apiService.getAssignmentsBySubject(selectedSubject);
      setAssignments(data);
    } catch (error) {
      showError('Failed to fetch assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const addRubricItem = () => {
    setNewAssignment(prev => ({ ...prev, rubric: [...prev.rubric, { criterion: '', points: '' }] }));
  };

  const removeRubricItem = (index: number) => {
    setNewAssignment(prev => ({ ...prev, rubric: prev.rubric.filter((_, i) => i !== index) }));
  };

  const updateRubricItem = (index: number, field: keyof RubricItem, value: string) => {
    setNewAssignment(prev => ({ ...prev, rubric: prev.rubric.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title.trim() || !selectedSubject) {
      showError('Please enter a title and select a subject');
      return;
    }
    const validRubric = newAssignment.rubric.filter(item => item.criterion.trim() && item.points);
    if (validRubric.length === 0) {
      showError('Please add at least one valid rubric criterion');
      return;
    }
    setCreating(true);
    try {
      await apiService.createAssignment(newAssignment.title, newAssignment.description, selectedSubject, validRubric, newAssignment.showDetailsToStudent);
      showSuccess('Assignment created successfully!');
      setNewAssignment({ title: '', description: '', rubric: [{ criterion: '', points: '' }], showDetailsToStudent: false });
      setShowCreateForm(false);
      fetchAssignments();
    } catch (error) {
      showError('Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleVisibility = async (assignmentId: string, currentVisibility: boolean) => {
    try {
      await apiService.updateAssignmentVisibility(assignmentId, !currentVisibility);
      showSuccess('Visibility updated successfully!');
      fetchAssignments();
    } catch (error) {
      showError('Failed to update visibility');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Assignment',
      message: `Are you sure you want to delete "${title}"? This will also delete all related submissions.`,
      confirmText: 'Delete',
      isDestructive: true,
    });
    if (confirmed) {
      try {
        await apiService.deleteAssignment(assignmentId);
        showSuccess('Assignment deleted successfully!');
        fetchAssignments();
      } catch (error) {
        showError('Failed to delete assignment');
      }
    }
  };

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-gray-900/30 border border-white/10 rounded-xl p-6 backdrop-blur-lg">
        <h2 className="text-xl font-bold text-white font-heading mb-6">Assignment Management</h2>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Select Subject</label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full md:w-72 px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white font-body">
            <option value="">Choose a subject...</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id} className="bg-gray-800 text-white">{subject.name}</option>
            ))}
          </select>
        </div>

        {selectedSubject && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white font-mono">{selectedSubjectData?.name} Assignments</h3>
              <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-mono text-sm">
                <Plus className="w-4 h-4 mr-2" />
                New Assignment
              </button>
            </div>

            <AnimatePresence>
              {showCreateForm && (
                <motion.div 
                  className="bg-gray-800/20 p-6 rounded-lg border border-white/10 mt-4"
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                >
                  <h4 className="text-md font-medium text-white mb-4 font-mono">Create New Assignment</h4>
                  <form onSubmit={handleCreateAssignment} className="space-y-4">
                    {/* Redesigned Form Fields */}
                    <input type="text" value={newAssignment.title} onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white" placeholder="Assignment title *" />
                    <textarea value={newAssignment.description} onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))} rows={4} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white" placeholder="Description / Model Answer" />
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Rubric *</label>
                      <div className="space-y-2">
                        {newAssignment.rubric.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input type="text" value={item.criterion} onChange={(e) => updateRubricItem(index, 'criterion', e.target.value)} className="flex-1 px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white" placeholder="Criterion" />
                            <input type="number" value={item.points} onChange={(e) => updateRubricItem(index, 'points', e.target.value)} className="w-24 px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white" placeholder="Points" min="1" />
                            {newAssignment.rubric.length > 1 && <button type="button" onClick={() => removeRubricItem(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addRubricItem} className="mt-2 text-blue-400 hover:text-blue-300 text-sm font-mono">+ Add Criterion</button>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="showDetails" checked={newAssignment.showDetailsToStudent} onChange={(e) => setNewAssignment(prev => ({ ...prev, showDetailsToStudent: e.target.checked }))} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                      <label htmlFor="showDetails" className="ml-2 text-sm text-gray-400">Show details to students initially</label>
                    </div>
                    <div className="flex space-x-3">
                      <button type="submit" disabled={creating} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-mono">{creating ? <LoadingSpinner size="small" text="Creating..." /> : 'Create'}</button>
                      <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg font-mono">Cancel</button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {selectedSubject && (
        <div className="mt-8">
          {loadingAssignments ? (
            <div className="flex justify-center py-8"><LoadingSpinner text="Loading assignments..." /></div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 bg-gray-900/20 border border-white/10 rounded-lg">
              <FileText className="w-12 h-12 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 font-mono">No assignments created yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <motion.div 
                  key={assignment.id} 
                  className="bg-gray-900/30 border border-white/10 rounded-lg p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-white mb-2 font-mono">{assignment.title}</h4>
                      <p className="text-gray-400 text-sm mb-3 font-body">{assignment.description?.substring(0, 150)}{assignment.description && assignment.description.length > 150 ? '...' : ''}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button onClick={() => handleToggleVisibility(assignment.id, assignment.showDetailsToStudent)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg" title={assignment.showDetailsToStudent ? 'Visible to students' : 'Hidden from students'}>
                        {assignment.showDetailsToStudent ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDeleteAssignment(assignment.id, assignment.title)} className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg" title="Delete assignment">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AssignmentManagementView;
