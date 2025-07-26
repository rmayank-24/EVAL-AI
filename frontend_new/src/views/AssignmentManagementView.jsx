import React, { useState, useEffect } from 'react';
import { Plus, Eye, EyeOff, Trash2, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import apiService from '../services/api';

const AssignmentManagementView = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    rubric: [{ criterion: '', points: '' }],
    showDetailsToStudent: false,
  });
  const [creating, setCreating] = useState(false);
  const { showError, showSuccess } = useNotification();
  const { confirm } = useConfirmation();

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
    setNewAssignment(prev => ({
      ...prev,
      rubric: [...prev.rubric, { criterion: '', points: '' }]
    }));
  };

  const removeRubricItem = (index) => {
    setNewAssignment(prev => ({
      ...prev,
      rubric: prev.rubric.filter((_, i) => i !== index)
    }));
  };

  const updateRubricItem = (index, field, value) => {
    setNewAssignment(prev => ({
      ...prev,
      rubric: prev.rubric.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.title.trim() || !selectedSubject) {
      showError('Please enter a title and select a subject');
      return;
    }

    const validRubric = newAssignment.rubric.filter(item => 
      item.criterion.trim() && item.points
    );

    if (validRubric.length === 0) {
      showError('Please add at least one rubric criterion');
      return;
    }

    setCreating(true);
    try {
      await apiService.createAssignment(
        newAssignment.title,
        newAssignment.description,
        selectedSubject,
        validRubric,
        newAssignment.showDetailsToStudent
      );

      showSuccess('Assignment created successfully!');
      setNewAssignment({
        title: '',
        description: '',
        rubric: [{ criterion: '', points: '' }],
        showDetailsToStudent: false,
      });
      setShowCreateForm(false);
      fetchAssignments();
    } catch (error) {
      showError('Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleVisibility = async (assignmentId, currentVisibility) => {
    try {
      await apiService.updateAssignmentVisibility(assignmentId, !currentVisibility);
      showSuccess('Visibility updated successfully!');
      fetchAssignments();
    } catch (error) {
      showError('Failed to update visibility');
    }
  };

  const handleDeleteAssignment = async (assignmentId, title) => {
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Assignment Management</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a subject...</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {selectedSubject && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedSubjectData?.name} Assignments
              </h3>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Assignment
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-gray-50 p-6 rounded-lg border animate-in slide-in-from-top-4 duration-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Create New Assignment</h4>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Assignment title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description / Model Answer
                    </label>
                    <textarea
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Provide detailed instructions or model answer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rubric *
                    </label>
                    <div className="space-y-2">
                      {newAssignment.rubric.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={item.criterion}
                            onChange={(e) => updateRubricItem(index, 'criterion', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Criterion (e.g., Grammar and clarity)"
                          />
                          <input
                            type="number"
                            value={item.points}
                            onChange={(e) => updateRubricItem(index, 'points', e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Points"
                            min="1"
                          />
                          {newAssignment.rubric.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRubricItem(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addRubricItem}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      + Add Criterion
                    </button>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showDetails"
                      checked={newAssignment.showDetailsToStudent}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, showDetailsToStudent: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="showDetails" className="ml-2 text-sm text-gray-700">
                      Show details to students initially
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {creating ? <LoadingSpinner size="small" text="Creating..." /> : 'Create Assignment'}
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

            {loadingAssignments ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Loading assignments..." />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No assignments created yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                          {assignment.title}
                        </h4>
                        {assignment.description && (
                          <p className="text-gray-600 text-sm mb-3">
                            {assignment.description.substring(0, 150)}
                            {assignment.description.length > 150 ? '...' : ''}
                          </p>
                        )}
                        {assignment.rubric && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-700">Rubric: </span>
                            <span className="text-sm text-gray-600">
                              {assignment.rubric.map(r => r.criterion).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleToggleVisibility(assignment.id, assignment.showDetailsToStudent)}
                          className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                          title={assignment.showDetailsToStudent ? 'Hide details from students' : 'Show details to students'}
                        >
                          {assignment.showDetailsToStudent ? (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Hidden
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentManagementView;