import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, ToggleLeft, ToggleRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';

const ChatbotModal = ({ submissionId, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [ragMode, setRagMode] = useState(false);
  const messagesEndRef = useRef(null);
  const { showError } = useNotification();

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
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
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
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      showError('Failed to get AI response');
      
      const errorMessage = {
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

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-teal-100 p-2 rounded-full mr-3">
              <Bot className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-sm text-gray-600">Ask questions about your submission</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Document-based answers</span>
          <button
            onClick={() => setRagMode(!ragMode)}
            className="flex items-center text-teal-600 hover:text-teal-700 transition-colors"
          >
            {ragMode ? (
              <ToggleRight className="w-6 h-6" />
            ) : (
              <ToggleLeft className="w-6 h-6" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-teal-100 text-teal-600'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
              </div>
              
              <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block max-w-xs md:max-w-md p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
                
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-teal-100 text-teal-600">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <LoadingSpinner size="small" text="Thinking..." />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about your submission..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotModal;