import { useState, useRef, useEffect, FormEvent } from 'react';
import { X, Send, Bot, User, ToggleLeft, ToggleRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useNotificationContext } from '../contexts/NotificationContext';
import apiService from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Define types for component props and state
interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

interface ChatbotModalProps {
  submissionId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationContextType {
  showError: (message: string) => void;
}

const ChatbotModal = ({ submissionId, isOpen, onClose }: ChatbotModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [ragMode, setRagMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showError } = useNotificationContext() as NotificationContextType;

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          id: 1,
          text: "Hi! I'm your AI assistant. I can help answer questions about your submission. Toggle the document mode to get answers based specifically on your submitted document.",
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await apiService.chat(submissionId, inputMessage, ragMode);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      showError('Failed to get AI response');
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an error. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-gray-900/50 border border-white/10 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center">
                <div className="bg-cyan-500/10 p-2 rounded-full mr-3 border border-cyan-500/20"><Bot className="w-5 h-5 text-cyan-400" /></div>
                <div>
                  <h3 className="text-lg font-bold text-white font-heading">AI Assistant</h3>
                  <p className="text-sm text-gray-400 font-body">Ask questions about your submission</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/20 border-b border-white/10">
              <span className="text-sm font-medium text-gray-300 font-mono">Document-based answers</span>
              <button onClick={() => setRagMode(!ragMode)} className={`flex items-center transition-colors ${ragMode ? 'text-cyan-400' : 'text-gray-500'}`}>
                {ragMode ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start space-x-3 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-800/50 border border-white/10">
                    {message.sender === 'user' ? <User className="w-4 h-4 text-blue-400" /> : <Bot className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block max-w-xs md:max-w-md p-3 rounded-lg ${message.sender === 'user' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' : 'bg-gray-800/70 text-gray-300'}`}>
                      <p className="text-sm whitespace-pre-wrap font-body">{message.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{formatTime(message.timestamp)}</p>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-800/50 border border-white/10"><Bot className="w-4 h-4 text-cyan-400" /></div>
                  <div className="bg-gray-800/70 p-3 rounded-lg"><LoadingSpinner size="small" text="Thinking..." /></div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
              <div className="flex space-x-2">
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Ask me anything..." className="flex-1 px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white font-body" disabled={loading} />
                <button type="submit" disabled={!inputMessage.trim() || loading} className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 font-mono">
                  {loading ? <LoadingSpinner size="small" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatbotModal;
