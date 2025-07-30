import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Send, Eye, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Define types for our state and data
interface Subject {
  id: string;
  name: string;
  teacherUid: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  rubric: { criterion: string; points: string }[];
  showDetailsToStudent: boolean;
}

interface Feedback {
  score: string;
  evaluation: string;
  mistakes: string[];
  feedback: string;
}

interface NotificationContextType {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const EvaluatorPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isStrictMode, setIsStrictMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { showError, showSuccess } = useNotification() as NotificationContextType;

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

  const fetchAssignments = async (subjectId: string) => {
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

  const onDrop = (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFeedback(null);
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
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) {
        showError('Selected subject not found.');
        return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignmentId', selectedAssignment);
      formData.append('subjectId', selectedSubject);
      formData.append('teacherUid', subject.teacherUid);
      formData.append('isStrictMode', String(isStrictMode));

      const result = await apiService.submitEvaluation(formData);
      setFeedback(result);
      showSuccess('Submission evaluated successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to evaluate submission');
    } finally {
      setLoading(false);
    }
  };

  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment);

  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-gray-900/30 border border-white/10 rounded-xl p-6 backdrop-blur-lg">
        <h2 className="text-xl font-bold text-white font-heading mb-6">Submit Your Work</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 text-white font-body"><option value="">Choose a subject...</option>{subjects.map((s) => (<option key={s.id} value={s.id} className="bg-gray-800">{s.name}</option>))}</select>
          <select value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)} disabled={!selectedSubject || loadingAssignments} className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 text-white font-body disabled:opacity-50"><option value="">Choose an assignment...</option>{assignments.map((a) => (<option key={a.id} value={a.id} className="bg-gray-800">{a.title}</option>))}</select>
        </div>

        {selectedAssignmentData && (
          <div className="mb-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-blue-300 font-mono">{selectedAssignmentData.title}</h3>
              {selectedAssignmentData.showDetailsToStudent && <button onClick={() => setShowDetails(!showDetails)} className="flex items-center text-blue-400 hover:text-white text-sm font-mono transition-colors"><Eye className="w-4 h-4 mr-1" />{showDetails ? 'Hide Details' : 'View Details'}</button>}
            </div>
            <AnimatePresence>{showDetails && selectedAssignmentData.showDetailsToStudent && (<motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} className="mt-4 space-y-3 overflow-hidden"><p className="text-blue-200 text-sm font-body">{selectedAssignmentData.description}</p></motion.div>)}</AnimatePresence>
          </div>
        )}

        <div className="mb-6">
          <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-gray-600 hover:border-gray-500'}`}>
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-200 mb-2 font-mono">{isDragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}</p>
            <p className="text-gray-500 font-body">Supports PDF, DOCX, and image files</p>
          </div>
          {file && <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-white/10 flex items-center space-x-3"><FileText className="w-5 h-5 text-blue-400" /><p className="font-medium text-gray-200 font-mono">{file.name}</p></div>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center"><input type="checkbox" id="strictMode" checked={isStrictMode} onChange={(e) => setIsStrictMode(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" /><label htmlFor="strictMode" className="ml-2 text-sm font-medium text-gray-400 font-body">Strict Mode</label></div>
          <button onClick={handleSubmit} disabled={loading || !file || !selectedAssignment} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-mono"><Send className="w-4 h-4 mr-2" />Submit</button>
        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className="bg-gray-900/30 border border-white/10 rounded-xl p-6 backdrop-blur-lg">
            <div className="flex items-center mb-4"><CheckCircle2 className="w-6 h-6 text-green-400 mr-2" /><h3 className="text-xl font-bold text-white font-heading">Evaluation Results</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20"><h4 className="font-medium text-blue-300 mb-1 font-mono">Score</h4><p className="text-2xl font-bold text-white">{feedback.score}</p></div>
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20"><h4 className="font-medium text-green-300 mb-1 font-mono">Evaluation</h4><p className="text-white font-body">{feedback.evaluation}</p></div>
            </div>
            {feedback.mistakes?.length > 0 && (<div className="mb-6"><h4 className="font-medium text-gray-300 mb-3 font-mono">Areas for Improvement:</h4><ul className="space-y-2">{feedback.mistakes.map((mistake, index) => (<li key={index} className="flex items-start"><AlertCircle className="w-4 h-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" /><span className="text-gray-300 font-body">{mistake}</span></li>))}</ul></div>)}
            {feedback.feedback && (<div><h4 className="font-medium text-gray-300 mb-3 font-mono">Detailed Feedback:</h4><p className="text-gray-300 leading-relaxed font-body">{feedback.feedback}</p></div>)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EvaluatorPage;
