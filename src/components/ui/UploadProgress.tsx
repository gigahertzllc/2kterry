import { X } from 'lucide-react';
import { formatFileSize, calculateUploadSpeed } from '../../utils/storage';

interface UploadProgressProps {
  fileName: string;
  progress: number; // 0-100
  uploadSpeed?: number; // bytes per second
  status: 'uploading' | 'processing' | 'complete' | 'error';
  errorMessage?: string;
  onCancel?: () => void;
  elapsedSeconds?: number;
}

export function UploadProgress({
  fileName,
  progress,
  uploadSpeed,
  status,
  errorMessage,
  onCancel,
  elapsedSeconds = 0
}: UploadProgressProps) {
  const isComplete = status === 'complete';
  const isError = status === 'error';

  return (
    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
      {/* File name and status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-300 truncate">{fileName}</span>
        </div>
        {!isComplete && !isError && (
          <button
            onClick={onCancel}
            className="ml-2 p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isError
                ? 'bg-red-500'
                : isComplete
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-orange-500 to-orange-400'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Status info */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-400">
          {isError ? (
            <span className="text-red-400">{errorMessage || 'Upload failed'}</span>
          ) : isComplete ? (
            <span className="text-green-400">Upload complete</span>
          ) : status === 'processing' ? (
            <span className="text-orange-400">Processing...</span>
          ) : (
            <span>{Math.round(progress)}%</span>
          )}
        </div>
        {!isError && !isComplete && uploadSpeed && elapsedSeconds > 0 && (
          <div className="text-gray-500">
            {calculateUploadSpeed(uploadSpeed, elapsedSeconds)}
          </div>
        )}
      </div>
    </div>
  );
}
