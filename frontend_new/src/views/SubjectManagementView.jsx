import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, GraduationCap, Edit } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import apiService from '../services/api';

const SubjectManagementView = () => {
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    description: '',
    teacherUid: '',
  });
  const [creating, setCreating] = useState(false);
  const { showError, showSuccess } = useNotification();
  const { confirm } = useConfirmation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsData, usersData] = await Promise.all([
        apiService.getSubjects(),
        apiService.getUsers()
      ]);
      
      // Debug: Log the subjects data
      console.log('🔍 Frontend received subjects data:', subjectsData);
      subjectsData.forEach((subject, index) => {
        console.log(`📚 Subject ${index + 1}:`, {
          name: subject.name,
          teacherUid: subject.teacherUid,
          teacher: subject.teacher,
          createdAt: subject.createdAt
        });
      });
      
      setSubjects(subjectsData);
      setUsers(usersData);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim() || !newSubject.teacherUid) {
      showError('Please enter a subject name and select a teacher');
      return;
    }

    setCreating(true);
    try {
      await apiService.createSubject(
        newSubject.name,
        newSubject.description,
        newSubject.teacherUid
      );

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

  const handleDeleteSubject = async (subjectId, subjectName) => {
    const confirmed = await confirm({
      title: 'Delete Subject',
      message: `Are you sure you want to delete "${subjectName}"? This will also delete all assignments and submissions for this subject.`,
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading subjects..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Subjects"
          value={subjects.length}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Available Teachers"
          value={teachers.length}
          icon={GraduationCap}
          color="green"
        />
        <StatCard
          title="Subjects per Teacher"
          value={teachers.length > 0 ? (subjects.length / teachers.length).toFixed(1) : '0'}
          icon={BookOpen}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Subject Management</h2>
              <p className="text-gray-600 mt-1">Create and manage subjects</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Subject
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="p-6 bg-gray-50 border-b border-gray-200 animate-in slide-in-from-top-4 duration-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Mathematics, Physics, Literature"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Teacher *
                  </label>
                  <select
                    value={newSubject.teacherUid}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, teacherUid: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a teacher...</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.uid} value={teacher.uid}>
                        {teacher.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the subject"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {creating ? <LoadingSpinner size="small" text="Creating..." /> : 'Create Subject'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects created yet</h3>
              <p className="text-gray-600">Create your first subject to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {subject.name}
                        </div>
                        {subject.description && (
                          <div className="text-sm text-gray-500">
                            {subject.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <GraduationCap className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm text-gray-900">
                          {subject.teacher ? subject.teacher.name : 'No teacher assigned'}
                        </span>
                        {/* Debug info */}
                        <div className="text-xs text-gray-400 ml-2">
                          (UID: {subject.teacherUid || 'none'})
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {subject.createdAt ? new Date(subject.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteSubject(subject.id, subject.name)}
                        className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectManagementView;