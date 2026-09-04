import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { resizeImageToBase64_500x500, saveUserProfile } from '../lib/userService';
import { 
  X, 
  Camera, 
  User as UserIcon, 
  Check, 
  AlertCircle, 
  Trash2, 
  Sparkles,
  UploadCloud,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  profile: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onProfileUpdated,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile?.displayName || user?.displayName || '');
      setPhotoBase64(profile?.photoBase64 || user?.photoURL || null);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, profile, user]);

  if (!isOpen || !user) return null;

  const handleFileChange = async (file: File) => {
    try {
      setIsProcessingImage(true);
      setError(null);
      setSuccessMessage(null);

      // Process and resize directly to 500x500 base64
      const base64 = await resizeImageToBase64_500x500(file);
      setPhotoBase64(base64);
    } catch (err: any) {
      console.error('Image processing failed:', err);
      setError(err.message || 'Failed to process image. Please try another image.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const onFileInputSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter a display name.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      await saveUserProfile(user.uid, {
        displayName: displayName.trim(),
        photoBase64: photoBase64,
        email: user.email || undefined,
      });

      const updatedProfile: UserProfile = {
        uid: user.uid,
        displayName: displayName.trim(),
        photoBase64: photoBase64 || undefined,
        email: user.email || undefined,
      };

      onProfileUpdated(updatedProfile);
      setSuccessMessage('Profile and 500×500 avatar saved successfully to Firebase and your account!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setError(err.message || 'Failed to save changes to Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <UserIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                Account & Profile Settings
              </h2>
              <p className="text-xs text-zinc-500">
                Update your display name & custom 500×500 avatar in 𝓓𝓪𝓶𝓸𝓷-𝓠𝓤𝓘𝓩
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Profile Picture Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Profile Avatar (500 × 500 px)
              </label>
              <span className="text-[11px] font-mono font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                Base64 String in Firestore
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <div 
                  className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-200 border-2 border-white shadow-md flex items-center justify-center relative"
                >
                  {photoBase64 ? (
                    <img 
                      src={photoBase64} 
                      alt="Avatar preview" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 text-white flex items-center justify-center font-extrabold text-2xl font-modern">
                      {displayName ? displayName[0].toUpperCase() : user.email?.[0].toUpperCase() || 'U'}
                    </div>
                  )}

                  {/* Loading spinner over avatar while processing */}
                  {isProcessingImage && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[10px]">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span className="mt-1">Resizing...</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  title="Upload new image"
                  className="absolute -bottom-1.5 -right-1.5 p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-md border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

              {/* Upload Controls & Drag and Drop Zone */}
              <div className="flex-1 w-full space-y-2">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-zinc-900 bg-zinc-100' 
                      : 'border-zinc-300 hover:border-zinc-400 bg-white'
                  }`}
                >
                  <UploadCloud className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                  <p className="text-xs font-semibold text-zinc-700">
                    Click to browse or drop an image here
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Auto-cropped and resized to 500×500 px
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileInputSelect}
                  accept="image/*"
                  className="hidden"
                />

                {photoBase64 && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 transition-colors cursor-pointer pt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove avatar photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name & Email Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Damon Rivera"
                className="w-full p-3 text-sm border border-zinc-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium text-zinc-900"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                This name will appear on all quizzes you create in 𝓓𝓪𝓶𝓸𝓷-𝓠𝓤𝓘𝓩.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={user.email || 'Anonymous Guest'}
                className="w-full p-3 text-sm border border-zinc-200 rounded-xl bg-zinc-100 text-zinc-500 font-mono"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved securely in your Firebase account</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isProcessingImage}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
