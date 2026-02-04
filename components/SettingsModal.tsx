import React from 'react';
import { AlertSettings, AssetType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AlertSettings;
  onSave: (newSettings: AlertSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = React.useState<AlertSettings>(settings);

  if (!isOpen) return null;

  const handleChange = (type: AssetType, value: string) => {
    const numValue = parseFloat(value);
    setLocalSettings(prev => ({
      ...prev,
      [type]: isNaN(numValue) ? 0 : numValue
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-void border-2 border-neon-blue rounded-2xl w-full max-w-md p-6 relative shadow-[0_0_30px_rgba(0,255,255,0.3)]">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black italic tracking-tighter text-neon-blue">
            LOUDNESS CONTROLS 🔊
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors font-mono"
          >
            [X]
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6 font-mono">
          Set the % threshold to trigger a sound alert. If the price swings hard, we'll let you know.
        </p>

        <div className="space-y-4">
          {Object.values(AssetType).map((type) => (
            <div key={type} className="flex items-center justify-between group">
              <label className="font-bold font-mono text-neon-pink group-hover:text-white transition-colors">
                {type}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">±</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={localSettings[type]}
                  onChange={(e) => handleChange(type, e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-right w-20 font-mono focus:outline-none focus:border-neon-green focus:bg-white/20 transition-all"
                />
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => { onSave(localSettings); onClose(); }}
            className="flex-1 bg-neon-blue text-black font-black py-3 rounded-xl hover:bg-white transition-colors uppercase tracking-widest shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            Save Config
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;