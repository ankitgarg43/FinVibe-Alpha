import React from 'react';
import { AlertSettings, AssetType, BackgroundType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AlertSettings;
  onSave: (newSettings: AlertSettings) => void;
  currentBg: BackgroundType;
  onChangeBg: (bg: BackgroundType) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, currentBg, onChangeBg }) => {
  const [localSettings, setLocalSettings] = React.useState<AlertSettings>(settings);

  if (!isOpen) return null;

  const handleChange = (type: AssetType, value: string) => {
    const numValue = parseFloat(value);
    setLocalSettings(prev => ({
      ...prev,
      [type]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const bgs: BackgroundType[] = ['VOID', 'OCEAN', 'CLOUDS', 'AURORA', 'PARTICLES'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-zen-card border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-light text-white">
            Preferences
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
        </div>

        {/* Background Selector */}
        <div className="mb-8">
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-3 block">Environment</label>
            <div className="grid grid-cols-3 gap-2">
                {bgs.map(bg => (
                    <button
                        key={bg}
                        onClick={() => onChangeBg(bg)}
                        className={`
                            py-2 rounded-lg text-xs font-medium border transition-all
                            ${currentBg === bg 
                                ? 'bg-white/10 text-white border-zen-green' 
                                : 'bg-transparent text-gray-500 border-white/5 hover:border-white/20 hover:text-gray-300'}
                        `}
                    >
                        {bg}
                    </button>
                ))}
            </div>
        </div>

        {/* Alerts */}
        <div className="mb-8">
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-3 block">Volatility Thresholds (Alerts)</label>
            <div className="space-y-3">
            {Object.values(AssetType).map((type) => (
                <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-300 font-light capitalize">{type.toLowerCase()}</span>
                <div className="flex items-center gap-2">
                    <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={localSettings[type]}
                    onChange={(e) => handleChange(type, e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-right w-16 text-sm text-white focus:outline-none focus:border-zen-green transition-all"
                    />
                    <span className="text-gray-600 text-xs">%</span>
                </div>
                </div>
            ))}
            </div>
        </div>

        <button
            onClick={() => { onSave(localSettings); onClose(); }}
            className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors"
        >
            Save Changes
        </button>

      </div>
    </div>
  );
};

export default SettingsModal;