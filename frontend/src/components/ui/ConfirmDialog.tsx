"use client";

import { FiX, FiAlertCircle, FiCheck, FiTrash2, FiLogOut } from "react-icons/fi";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: 'warning' | 'info' | 'delete' | 'logout' | 'success';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
  icon = 'info',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (icon) {
      case 'warning':
        return <FiAlertCircle className="h-8 w-8 text-yellow-500" />;
      case 'delete':
        return <FiTrash2 className="h-8 w-8 text-red-500" />;
      case 'logout':
        return <FiLogOut className="h-8 w-8 text-blue-500" />;
      case 'success':
        return <FiCheck className="h-8 w-8 text-green-500" />;
      default:
        return <FiAlertCircle className="h-8 w-8 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Message */}
        <p className="mt-3 text-sm text-gray-600">{message}</p>

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
