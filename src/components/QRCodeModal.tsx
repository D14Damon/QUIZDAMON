import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Quiz } from '../types';
import { getShareableQuizUrl } from '../lib/quizHelpers';
import { QrCode, Copy, Check, Download, X, Lock, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  quiz,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const shareUrl = quiz ? getShareableQuizUrl(quiz) : '';

  useEffect(() => {
    if (!isOpen || !shareUrl) return;
    QRCode.toDataURL(shareUrl, {
      width: 520,
      margin: 2,
      color: {
        dark: '#09090b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR Code generation failed:', err));
  }, [isOpen, shareUrl]);

  if (!isOpen || !quiz) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    const slug = (quiz.customSlug || quiz.title || 'quiz')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');
    link.download = `quizzy-qr-${slug}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-zinc-200 p-6 sm:p-7 space-y-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between text-left pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 tracking-tight font-modern">
                Classroom QR Code & Link
              </h3>
              <p className="text-[11px] text-zinc-500">
                Scan with any phone or tablet camera to join immediately
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiz Title & Optional PIN */}
        <div className="space-y-1.5">
          <h4 className="text-lg font-extrabold text-zinc-900 line-clamp-2">
            {quiz.title || 'Untitled Quiz'}
          </h4>
          {quiz.settings?.accessCode && quiz.settings.accessCode.trim() && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Access PIN:</span>
              <span className="font-mono text-sm tracking-widest bg-white px-2 py-0.5 rounded border border-amber-300">
                {quiz.settings.accessCode}
              </span>
            </div>
          )}
        </div>

        {/* QR Code Canvas Display */}
        <div className="p-4 bg-zinc-50 border-2 border-zinc-200 rounded-2xl inline-block mx-auto shadow-inner">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for ${quiz.title}`}
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl bg-white p-2 border border-zinc-200 mx-auto"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-zinc-400">
              Generating QR Code...
            </div>
          )}
        </div>

        {/* Direct URL Copy Box */}
        <div className="space-y-2 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Direct Quiz Link
          </span>
          <div className="flex items-center gap-1.5 p-1.5 bg-zinc-50 border border-zinc-200 rounded-xl">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs font-mono text-zinc-700 px-2 flex-1 truncate focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                copied ? 'bg-emerald-600 text-white' : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownloadQR}
            className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download QR (.PNG)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
