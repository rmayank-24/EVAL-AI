import { createContext, useState, ReactNode, useContext } from 'react';
import { AlertTriangle, X } from 'lucide-react';

// --- Type Definitions ---

// Defines the options that can be passed to the confirm function
interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

// Defines the shape of the state that manages the modal
interface ConfirmationState extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// Defines the props for the internal ConfirmationModal component
interface ConfirmationModalProps extends ConfirmOptions {
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

// Defines the value provided by the context
export interface ConfirmationContextType {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
}

// Defines the props for the provider component
interface ConfirmationProviderProps {
  children: ReactNode;
}


// --- Context Creation ---

// Create the context with a default value to satisfy TypeScript
export const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);


// --- Components ---

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText, 
    cancelText, 
    isDestructive 
}: ConfirmationModalProps) => {
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
              aria-label="Close"
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

export const ConfirmationProvider = ({ children }: ConfirmationProviderProps) => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDestructive: false,
    onConfirm: () => {},
    onClose: () => {},
  });

  const confirm = (options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmationState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        isDestructive: options.isDestructive || false,
        onConfirm: () => {
          handleClose();
          resolve(true);
        },
        onClose: () => {
            handleClose();
            resolve(false);
        }
      });
    });
  };

  const handleClose = () => {
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
  };

  const value: ConfirmationContextType = { confirm };

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      <ConfirmationModal
        {...confirmationState}
      />
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) throw new Error('useConfirmation must be used within ConfirmationProvider');
  return context;
};
