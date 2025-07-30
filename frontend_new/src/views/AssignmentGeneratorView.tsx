import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Plus, Minus, Wand2, Save } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import { motion } from 'framer-motion';

interface Subject {
  id: string;
  name: string;
}

interface RubricItem {
  criterion: string;
  points: string;
}

interface GeneratedContent {
  question: string;
  modelAnswer: string;
  rubric: RubricItem[];
}

// Ensure this matches the actual return type of useNotification context
// If you are using 'useNotificationContext' from NotificationContext.tsx directly,
// the cast might not be strictly needed if the hook's return type is already correct.
// However, if useNotification() is used as a direct alias and the context isn't typed properly,
// this cast helps satisfy TypeScript. Given previous issues, we'll keep it for robustness.
interface NotificationContextType {
  showError: (message: string, duration?: number) => number; // Added duration
  showSuccess: (message: string, duration?: number) => number; // Added duration
  showWarning: (message: string, duration?: number) => number;
  showInfo: (message: string, duration?: number) => number;
}


const AssignmentGeneratorView = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [assignmentType, setAssignmentType] = useState('');
  const [totalMarks, setTotalMarks] = useState(10);
  const [customRubric, setCustomRubric] = useState<RubricItem[]>([{ criterion: '', points: '' }]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDetailsToStudent, setShowDetailsToStudent] = useState(false);
  // Ensured correct typing for useNotification hook
  const { showError, showSuccess } = useNotification() as NotificationContextType;

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await apiService.getSubjects();
      setSubjects(data);
    } catch {
      showError('Failed to fetch subjects');
    }
  }, [showError]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const addRubricItem = () => {
    setCustomRubric(prev => [...prev, { criterion: '', points: '' }]);
  };

  const removeRubricItem = (index: number) => {
    setCustomRubric(prev => prev.filter((_, i) => i !== index));
  };

  const updateRubricItem = (index: number, field: keyof RubricItem, value: string) => {
    setCustomRubric(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate assignment';
      showError(message);
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
    } catch {
      showError('Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto space-y-8 p-4 md:p-0" // Added padding for smaller screens
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-gray-900/30 border border-white/10 rounded-xl p-6 backdrop-blur-lg">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3 rounded-lg mr-4 border border-purple-500/20">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-heading">AI Assignment Generator</h2>
            <p className="text-gray-400 font-body">Create assignments with AI-powered content generation</p>
          </div>
        </div>

        {/* Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="topicInput" className="block text-sm font-medium text-gray-400 mb-1 font-mono">Topic</label>
            <input id="topicInput" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Photosynthesis" className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 text-white font-body" />
          </div>

          <div>
            <label htmlFor="assignmentTypeInput" className="block text-sm font-medium text-gray-400 mb-1 font-mono">Assignment Type</label>
            <input id="assignmentTypeInput" type="text" value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)} placeholder="e.g., Essay, Quiz, Project" className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 text-white font-body" />
          </div>

          <div>
            <label htmlFor="totalMarksInput" className="block text-sm font-medium text-gray-400 mb-1 font-mono">Total Marks</label>
            <input id="totalMarksInput" type="number" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} min="1" max="100" className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 text-white font-body" />
          </div>

          <div>
            <label htmlFor="subjectSelect" className="block text-sm font-medium text-gray-400 mb-1 font-mono">Subject</label>
            <select id="subjectSelect" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 text-white font-body">
              <option value="">Select subject...</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Rubric Criteria */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Custom Rubric Criteria</label>
          <div className="space-y-3">
            {customRubric.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <label htmlFor={`criterion-${index}`} className="sr-only">Criterion {index + 1}</label>
              <input id={`criterion-${index}`} type="text" value={item.criterion} onChange={(e) => updateRubricItem(index, 'criterion', e.target.value)} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 text-white font-body flex-1 sm:w-auto" placeholder="Criterion" />
                
                <label htmlFor={`points-${index}`} className="sr-only">Points {index + 1}</label>
                <input id={`points-${index}`} type="number" value={item.points} onChange={(e) => updateRubricItem(index, 'points', e.target.value)} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 text-white font-body sm:w-24" placeholder="Points" min="1" />
                
                {customRubric.length > 1 && (
                  <button onClick={() => removeRubricItem(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg flex-shrink-0" aria-label={`Remove criterion ${index + 1}`}>
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addRubricItem} className="mt-4 text-purple-400 hover:text-purple-300 flex items-center px-3 py-1 rounded-md transition-colors font-mono">
            <Plus className="w-4 h-4 mr-1" />
            Add Criterion
          </button>
        </div>

        {/* Checkbox and Generate Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <input
              id="showDetails"
              type="checkbox"
              checked={showDetailsToStudent}
              onChange={(e) => setShowDetailsToStudent(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 transition-colors duration-200"
            />
            <label htmlFor="showDetails" className="ml-2 text-sm text-gray-400 font-body cursor-pointer">Show details to students</label>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="flex items-center px-5 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-pink-400 text-white rounded-lg font-bold hover:from-purple-600 hover:via-pink-600 hover:to-pink-500 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-heading tracking-wide"
          >
            {generating ? <LoadingSpinner size="small" text="Generating..." /> : <><Wand2 className="w-4 h-4 mr-2" />Generate</>}
          </button>
        </div>
      </div>

      {/* Generated Content Section */}
      {generatedContent && (
        <motion.div
          className="bg-gray-900/30 border border-white/10 rounded-xl p-6 backdrop-blur-lg mt-8" // Added mt-8 for spacing
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-bold text-white mb-4 font-heading">Generated Assignment Details</h3>
          <div className="space-y-6">
            <div>
              <label htmlFor="questionArea" className="block text-sm text-gray-400 mb-2 font-mono">Assignment Question</label>
              <textarea id="questionArea" value={generatedContent.question} onChange={(e) => setGeneratedContent(prev => prev ? ({ ...prev, question: e.target.value }) : null)} rows={6} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 text-white font-body" />
            </div>
            <div>
              <label htmlFor="answerArea" className="block text-sm text-gray-400 mb-2 font-mono">Model Answer</label>
              <textarea id="answerArea" value={generatedContent.modelAnswer} onChange={(e) => setGeneratedContent(prev => prev ? ({ ...prev, modelAnswer: e.target.value }) : null)} rows={8} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 text-white font-body" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">Rubric</label>
              <div className="bg-gray-800/50 p-4 rounded-lg border border-white/10">
                {generatedContent.rubric.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-white/5 last:border-b-0">
                    <span className="text-gray-300 font-body">{item.criterion}</span>
                    <span className="text-white font-mono">{item.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={handleSave}
                disabled={saving || !selectedSubject}
                className="flex items-center px-5 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-heading tracking-wide"
              >
                {saving ? <LoadingSpinner size="small" text="Saving..." /> : <><Save className="w-4 h-4 mr-2" />Create Assignment</>}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AssignmentGeneratorView;