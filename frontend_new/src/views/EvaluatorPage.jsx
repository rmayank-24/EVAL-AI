import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, AlertCircle, Send, Eye, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';

const EvaluatorPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [file, setFile] = useState(null);
  const [isStrictMode, setIsStrictMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchAssignments(selectedSubject);
    } else {
      setAssignments([]);
      setSelectedAssignment('');
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

  const fetchAssignments = async (subjectId) => {
    setLoadingAssignments(true);
    try {
      const data = await apiService.getAssignmentsBySubject(subjectId);
      setAssignments(data);
    } catch (error) {
      showError('Failed to fetch assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const onDrop = (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const imageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      
      if ([...validTypes, ...imageTypes].includes(uploadedFile.type)) {
        setFile(uploadedFile);
        setFeedback(null);
      } else {
        showError('Please upload a PDF, DOCX, or image file');
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple: false
  });

  const handleSubmit = async () => {
    if (!file || !selectedAssignment || !selectedSubject) {
      showError('Please select a subject, assignment, and upload a file');
      return;
    }

    const assignment = assignments.find(a => a.id === selectedAssignment);
    const subject = subjects.find(s => s.id === selectedSubject);

    setLoading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignmentId', selectedAssignment);
      formData.append('subjectId', selectedSubject);
      formData.append('teacherUid', subject.teacherUid);
      formData.append('isStrictMode', isStrictMode);

      const result = await apiService.submitEvaluation(formData);
      setFeedback(result);
      showSuccess('Submission evaluated successfully!');
    } catch (error) {
      showError(error.message || 'Failed to evaluate submission');
    } finally {
      setLoading(false);
    }
  };

  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment);
  const canShowDetails = selectedAssignmentData?.showDetailsToStudent;

  const renderFilePreview = () => {
    if (!file) return null;

    const isImage = file.type.startsWith('image/');
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-3">
          {isImage ? <Image className="w-5 h-5 text-blue-600" /> : <FileText className="w-5 h-5 text-blue-600" />}
          <div>
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
        {isImage && (
          <div className="mt-3">
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="max-w-full h-auto max-h-64 rounded-lg border"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Submit Your Work</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a subject...</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Assignment
            </label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              disabled={!selectedSubject || loadingAssignments}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            >
              <option value="">Choose an assignment...</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </select>
            {loadingAssignments && (
              <div className="mt-2">
                <LoadingSpinner size="small" text="Loading assignments..." />
              </div>
            )}
          </div>
        </div>

        {selectedAssignmentData && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-blue-900">{selectedAssignmentData.title}</h3>
              {canShowDetails && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {showDetails ? 'Hide Details' : 'View Details'}
                </button>
              )}
            </div>
            
            {showDetails && canShowDetails && (
              <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                {selectedAssignmentData.description && (
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Model Answer:</h4>
                    <p className="text-blue-800 text-sm">{selectedAssignmentData.description}</p>
                  </div>
                )}
                {selectedAssignmentData.rubric && (
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Rubric:</h4>
                    <div className="space-y-1">
                      {selectedAssignmentData.rubric.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-blue-800">{item.criterion}</span>
                          <span className="font-medium text-blue-900">{item.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!canShowDetails && (
              <p className="text-blue-700 text-sm mt-2">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Assignment details are hidden by your teacher
              </p>
            )}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Your Submission
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
            </p>
            <p className="text-gray-500">or click to browse</p>
            <p className="text-sm text-gray-400 mt-2">
              Supports PDF, DOCX, and image files
            </p>
          </div>
          {renderFilePreview()}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="strictMode"
              checked={isStrictMode}
              onChange={(e) => setIsStrictMode(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="strictMode" className="ml-2 text-sm font-medium text-gray-700">
              Strict Mode (More rigorous evaluation)
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !file || !selectedAssignment}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoadingSpinner size="small" text="Evaluating..." />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit for Evaluation
              </>
            )}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-white rounded-lg shadow-sm border p-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Evaluation Results</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-1">Score</h4>
              <p className="text-2xl font-bold text-blue-600">{feedback.score}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-1">Evaluation</h4>
              <p className="text-green-800">{feedback.evaluation}</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-1">Mode</h4>
              <p className="text-orange-800">{isStrictMode ? 'Strict' : 'General'}</p>
            </div>
          </div>

          {feedback.mistakes && feedback.mistakes.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Areas for Improvement:</h4>
              <ul className="space-y-2">
                {feedback.mistakes.map((mistake, index) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.feedback && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Detailed Feedback:</h4>
              <p className="text-gray-700 leading-relaxed">{feedback.feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvaluatorPage;