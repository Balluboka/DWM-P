import React from 'react';
import { FileQuestion } from 'lucide-react';

const EmptyState = ({ icon: Icon = FileQuestion, title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="w-16 h-16 bg-surface-800 rounded-full flex items-center justify-center mb-4 text-surface-500">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      {message && <p className="text-surface-400 text-sm max-w-sm mx-auto mb-6">{message}</p>}
      
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
