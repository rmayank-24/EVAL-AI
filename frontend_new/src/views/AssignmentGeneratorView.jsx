import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Minus, Wand2, Save } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';

const AssignmentGeneratorView = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [assignmentType, setAssignmentType] = useState('');
  const [totalMarks, setTotalMarks] = useState(10);
  const [customRubric, setCustomRubric] = useState([{ criterion: '', points: '' }]);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDetailsToStudent, setShowDetailsToStudent] = useState(false);
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await apiService.getSubjects();
      setSubjects(data);
    } catch (error) {
      showError('Failed to fetch subjects');
    }
  };

  const addRubricItem = () => {
    setCustomRubric(prev => [...prev, { criterion: '', points: '' }]);
  };

  const removeRubricItem = (index) => {
    setCustomRubric(prev => prev.filter((_, i) => i !== index));
  };

  const updateRubricItem = (index, field, value) => {
    setCustomRubric(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      showError('Please enter a topic');
      return;
    }

    setGenerating(true);
    setGeneratedContent(null);

    try {
      const validRubric = customRubric.filter(item => item.criterion && item.points);
      const result = await apiService.generateAssignment(
        topic,
        assignmentType,
        totalMarks,
        validRubric
      );
      
      setGeneratedContent(result);
      showSuccess('Assignment generated successfully!');
    } catch (error) {
      showError(error.message || 'Failed to generate assignment');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent || !selectedSubject) {
      showError('Please select a subject and generate content first');
      return;
    }

    setSaving(true);
    try {
      await apiService.createAssignment(
        generatedContent.question,
        generatedContent.modelAnswer,
        selectedSubject,
        generatedContent.rubric,
        showDetailsToStudent
      );
      
      showSuccess('Assignment created successfully!');
      setGeneratedContent(null);
      setTopic('');
      setAssignmentType('');
    } catch (error) {
      showError('Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-full mr-4">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Assignment Generator</h2>
            <p className="text-gray-600">Create assignments with AI-powered content generation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Photosynthesis, Shakespeare's Hamlet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Type
            </label>
            <input
              type="text"
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Essay, Problem Set, Lab Report"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Marks *
            </label>
            <input
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject for Saving
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select subject...</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Rubric Criteria
          </label>
          <div className="space-y-3">
            {customRubric.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={item.criterion}
                  onChange={(e) => updateRubricItem(index, 'criterion', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Grammar and clarity"
                />
                <input
                  type="number"
                  value={item.points}
                  onChange={(e) => updateRubricItem(index, 'points', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="pts"
                  min="1"
                />
                {customRubric.length > 1 && (
                  <button
                    onClick={() => removeRubricItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={addRubricItem}
            className="mt-3 flex items-center text-purple-600 hover:text-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Criterion
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showDetails"
              checked={showDetailsToStudent}
              onChange={(e) => setShowDetailsToStudent(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="showDetails" className="ml-2 text-sm font-medium text-gray-700">
              Show details to students initially
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="flex items-center px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <LoadingSpinner size="small" text="Generating..." />
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Assignment
              </>
            )}
          </button>
        </div>
      </div>

      {generatedContent && (
        <div className="bg-white rounded-lg shadow-sm border p-6 animate-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Assignment</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Question
              </label>
              <textarea
                value={generatedContent.question}
                onChange={(e) => setGeneratedContent(prev => ({ ...prev, question: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Answer
              </label>
              <textarea
                value={generatedContent.modelAnswer}
                onChange={(e) => setGeneratedContent(prev => ({ ...prev, modelAnswer: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rubric
              </label>
              <div className="bg-gray-50 p-4 rounded-lg border">
                {generatedContent.rubric.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span className="text-gray-700">{item.criterion}</span>
                    <span className="font-medium text-gray-900">{item.points} pts</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !selectedSubject}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <LoadingSpinner size="small" text="Saving..." />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentGeneratorView;