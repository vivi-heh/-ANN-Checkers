import React, { useRef, useState } from 'react';
import {
  Save,
  FolderOpen,
  Download,
  Upload,
  X,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
} from 'lucide-react';
import {
  SavedCheckersState,
  loadGameStateFromStorage,
  downloadStateAsJson,
  parseUploadedSaveFile,
} from '../utils/saveLoad';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: SavedCheckersState;
  onSaveCurrent: () => void;
  onLoadState: (state: SavedCheckersState) => void;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onSaveCurrent,
  onLoadState,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const savedInStorage = loadGameStateFromStorage();

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleManualSave = () => {
    onSaveCurrent();
    showFeedback('Current game state saved to local storage!');
  };

  const handleManualLoad = () => {
    const loaded = loadGameStateFromStorage();
    if (loaded) {
      onLoadState(loaded);
      showFeedback('Saved game state loaded successfully!');
      setTimeout(() => onClose(), 600);
    } else {
      showFeedback('No saved game found in storage.');
    }
  };

  const handleDownloadFile = () => {
    downloadStateAsJson(currentState);
    showFeedback('Save file downloaded as JSON!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseUploadedSaveFile(file);
      onLoadState(parsed);
      showFeedback('Uploaded game state loaded successfully!');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      showFeedback(err.message || 'Error parsing save file');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-200 flex flex-col gap-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-stone-800">
          <Save className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-base font-bold tracking-tight text-stone-100">
              Save & Load Checkers Game
            </h2>
            <p className="text-xs text-stone-400">
              Preserves board layout, active player turn, and captured pieces
            </p>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Current State Snapshot */}
        <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 flex flex-col gap-2">
          <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
            Current Board Snapshot
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-stone-400">Active Turn</span>
              <span className="font-semibold text-stone-100 capitalize">
                {currentState.turn === 'red' ? 'Human (Red)' : 'AI (Black)'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-stone-400">Difficulty</span>
              <span className="font-semibold text-amber-400 capitalize">
                {currentState.difficulty}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-stone-400">Red Lost (Captured)</span>
              <span className="font-mono text-rose-300">
                {currentState.capturedPieces.redLostTotal} pieces
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-stone-400">Black Lost (Captured)</span>
              <span className="font-mono text-stone-300">
                {currentState.capturedPieces.blackLostTotal} pieces
              </span>
            </div>
          </div>
        </div>

        {/* Stored State Snapshot (if exists) */}
        {savedInStorage && (
          <div className="p-3 rounded-xl bg-stone-950/40 border border-stone-850 flex items-center justify-between text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-stone-300 font-medium">Last Saved in Storage</span>
              <span className="text-[10px] text-stone-500 font-mono">
                {savedInStorage.savedAt} · Turn: {savedInStorage.turn.toUpperCase()}
              </span>
            </div>
            <button
              onClick={handleManualLoad}
              className="px-3 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              Restore Slot
            </button>
          </div>
        )}

        {/* Action Trigger Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleManualSave}
            className="p-3 rounded-xl bg-amber-500 text-stone-950 font-semibold hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save to Browser</span>
          </button>

          <button
            onClick={handleManualLoad}
            disabled={!savedInStorage}
            className="p-3 rounded-xl bg-stone-800 text-stone-100 font-semibold hover:bg-stone-750 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-stone-700 text-xs"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Load from Browser</span>
          </button>

          <button
            onClick={handleDownloadFile}
            className="p-3 rounded-xl bg-stone-850 text-stone-300 hover:text-stone-100 hover:bg-stone-800 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-stone-800 text-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Save File</span>
          </button>

          <label className="p-3 rounded-xl bg-stone-850 text-stone-300 hover:text-stone-100 hover:bg-stone-800 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-stone-800 text-xs">
            <Upload className="w-4 h-4" />
            <span>Import Save File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

      </div>
    </div>
  );
};
