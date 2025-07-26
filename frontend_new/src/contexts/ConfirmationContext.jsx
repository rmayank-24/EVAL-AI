import React, { createContext, useContext, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationContext = createContext();

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, isDestructive }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className={`w-6 h-6 mr-3 ${isDestructive ? 'text-red-500' : 'text-yellow-500'}`} />
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConfirmationProvider = ({ children }) => {
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDestructive: false,
    onConfirm: () => {},
  });

  const confirm = ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
  }) => {
    return new Promise((resolve) => {
      setConfirmationState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        isDestructive,
        onConfirm: () => {
          setConfirmationState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  };

  const handleClose = () => {
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
  };

  const value = { confirm };

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      <ConfirmationModal
        {...confirmationState}
        onClose={handleClose}
      />
    </ConfirmationContext.Provider>
  );
};