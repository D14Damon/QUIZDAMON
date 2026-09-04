import React, { useState, useEffect } from 'react';
import { Quiz } from '../types';
import { formatQuizSlug, generateDefaultQuizSlug, getShareableQuizUrl } from '../lib/quizHelpers';
import { updateQuizCustomSlug } from '../lib/quizDbService';
import { Link2, Check, Copy, Sparkles, ExternalLink, X, Globe } from 'lucide-react';

interface CustomSlugModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  onSlugUpdated: (newSlug: string) => void;
}

export const CustomSlugModal: React.FC<CustomSlugModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onSlugUpdated,
}) => {
  const [slug, setSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quiz) {
      setSlug(quiz.customSlug || generateDefaultQuizSlug(quiz.title));
      setSavedSuccess(false);
      setError(null);
    }
  }, [quiz, isOpen]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://damonquiz.local';
  const previewUrl = `${currentOrigin}/?quiz=${slug || quiz.id}`;

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatQuizSlug(e.target.value);
    setSlug(formatted);
    setError(null);
  };

  const handleApplyTitleSuggestion = () => {
    const suggested = generateDefaultQuizSlug(quiz.title);
    setSlug(suggested);
  };

  const handleSave = async () => {
    const cleanSlug = formatQuizSlug(slug);
    if (!cleanSlug) {
      setError('Please enter a valid link slug using letters, numbers, and dashes.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateQuizCustomSlug(quiz.id, cleanSlug);
      onSlugUpdated(cleanSlug);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving custom slug:', err);
      setError('Failed to update quiz link slug. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 font-modern">Edit Quiz Link</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Customize your quiz's shareable web address and vanity slug
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input & Link Builder */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-zinc-700">
            Custom Link Slug / Alias
          </label>
          <div className="flex items-center border border-zinc-300 focus-within:border-zinc-900 rounded-2xl overflow-hidden bg-white shadow-2xs transition-colors">
            <span className="px-3 py-2.5 bg-zinc-100/70 border-r border-zinc-200 text-xs font-mono text-zinc-500 shrink-0">
              ?quiz=
            </span>
            <input
              type="text"
              value={slug}
              onChange={handleSlugChange}
              placeholder="e.g. damonquiz-science-exam"
              className="w-full text-xs sm:text-sm font-mono text-zinc-900 px-3 py-2.5 focus:outline-none"
            />
            {quiz.title && (
              <button
                type="button"
                onClick={handleApplyTitleSuggestion}
                className="px-3 py-1.5 mr-1.5 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                title="Auto-generate slug from title"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>From Title</span>
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          )}

          {/* Real-time Link Preview */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Full Shareable Link Preview
              </span>
              <button
                onClick={handleCopyLink}
                className="text-[11px] font-semibold text-zinc-800 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-500" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs font-mono text-zinc-700 break-all select-all">
              {previewUrl}
            </p>
          </div>
        </div>

        {/* Informational Domain Explanation Card */}
        <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-2xl space-y-1.5 text-xs text-sky-950">
          <div className="flex items-center gap-2 font-bold text-sky-900">
            <Globe className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Can I use a domain like damonquiz(title).com?</span>
          </div>
          <p className="text-[11px] text-sky-800 leading-relaxed">
            Standard <strong>.com</strong> addresses (such as <em>damonquizmath.com</em>) are global web domains that must be purchased from a domain registrar (like Namecheap, Cloudflare, or GoDaddy).
          </p>
          <p className="text-[11px] text-sky-800 leading-relaxed">
            With our <strong>Custom Slug</strong> above, your link is instantly accessible as <code>?quiz=damonquiz-title</code>. If you point a custom domain (e.g. <code>damonquiz.com</code>) to this application, your link will automatically be <code>https://damonquiz.com/?quiz=your-title</code>!
          </p>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Link Updated!</span>
              </>
            ) : (
              <span>Save Link Slug</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
