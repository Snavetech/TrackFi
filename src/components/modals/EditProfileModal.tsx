import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { SUPPORTED_CURRENCIES } from '../../types';
import { X, User, Camera, Save, Check, Upload } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || PRESET_AVATARS[0]);
  const [currency, setCurrency] = useState(user?.preferred_currency || 'NGN');
  const [threshold, setThreshold] = useState(user?.low_balance_threshold?.toString() || '10000');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setAvatarUrl(user.avatar_url || PRESET_AVATARS[0]);
      setCurrency(user.preferred_currency || 'NGN');
      setThreshold(user.low_balance_threshold?.toString() || '10000');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
      preferred_currency: currency,
      low_balance_threshold: parseFloat(threshold) || 10000,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#332a54]/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white border border-purple-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-50 bg-[#f4f0f8]/50 shrink-0">
          <div className="flex items-center gap-2 text-[#332a54] font-bold text-lg">
            <User className="w-5 h-5 text-[#6e44ff]" />
            <span>Edit User Profile</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-[#8b849c] hover:text-[#332a54] hover:bg-purple-100/50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#8b849c] mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('modal-avatar-file')?.click()}>
                <img
                  src={avatarUrl}
                  alt="Profile Preview"
                  className="w-16 h-16 rounded-full object-cover shadow-md ring-4 ring-purple-100 transition group-hover:opacity-80"
                />
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                  <Camera className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="modal-avatar-file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setAvatarUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('modal-avatar-file')?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#6e44ff] rounded-xl text-xs font-semibold border border-purple-100 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>
                </div>

                <div className="pt-1">
                  <p className="text-[11px] text-[#8b849c] mb-1.5">Or choose an avatar preset:</p>
                  <div className="flex items-center gap-2">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`w-7 h-7 rounded-full overflow-hidden border-2 transition ${avatarUrl === url ? 'border-[#6e44ff] scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#8b849c] mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-sm focus:outline-none focus:border-[#6e44ff] font-medium"
            />
          </div>

          {/* Preferred Currency */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#8b849c] mb-1">Preferred Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] text-sm focus:outline-none focus:border-[#6e44ff] font-mono font-semibold"
            >
              {SUPPORTED_CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol} {c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Low Balance Warning Threshold */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[#8b849c] mb-1">Low Balance Alert Threshold</label>
            <input
              type="number"
              step="100"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-purple-100 rounded-2xl text-[#332a54] font-mono text-sm focus:outline-none focus:border-[#6e44ff]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-between">
            {savedSuccess ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <Check className="w-4 h-4" /> Profile Updated!
              </span>
            ) : <span />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-[#8b849c] hover:text-[#332a54]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-semibold shadow-md shadow-purple-500/20 transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
