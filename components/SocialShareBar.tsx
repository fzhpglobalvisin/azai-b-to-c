// components/SocialShareBar.tsx — Social Media Sharing Header Bar
import React, { useState } from 'react';
import { 
  Share2, 
  MessageCircle, 
  Linkedin, 
  Twitter, 
  Send, 
  Mail, 
  Copy, 
  Check,
  Facebook
} from 'lucide-react';

interface SocialShareBarProps {
  appTitle?: string;
  shareUrl?: string;
}

export const SocialShareBar: React.FC<SocialShareBarProps> = ({
  appTitle = 'AI Business Strategy Advisor & Document Intelligence',
  shareUrl = typeof window !== 'undefined' ? window.location.href : ''
}) => {
  const [copied, setCopied] = useState(false);

  const textMessage = encodeURIComponent(`${appTitle} — Real-time Enterprise Business Intelligence, PDF Synthesis & Voice Strategy:`);
  const encodedUrl = encodeURIComponent(shareUrl || 'https://ai.studio');

  const shareLinks = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${textMessage}%20${encodedUrl}`,
      icon: MessageCircle,
      color: 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: Linkedin,
      color: 'hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-950/40 dark:hover:text-sky-300 border-sky-200/60 dark:border-sky-800/60 text-sky-700 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30'
    },
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${textMessage}&url=${encodedUrl}`,
      icon: Twitter,
      color: 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/70'
    },
    {
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${textMessage}`,
      icon: Send,
      color: 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
    },
    {
      name: 'Email',
      href: `mailto:?subject=${encodeURIComponent(appTitle)}&body=${textMessage}%20${encodedUrl}`,
      icon: Mail,
      color: 'hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 border-amber-200/60 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30'
    }
  ];

  const handleCopyLink = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(shareUrl || window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.error('Clipboard copy failed', e);
    }
  };

  return (
    <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-1.5 flex items-center justify-between gap-3 text-xs z-30 transition-colors">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-1.5 text-[11px] sm:text-xs">
          <Share2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Share:</span>
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 max-w-full">
        {shareLinks.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all shadow-2xs active:scale-95 whitespace-nowrap cursor-pointer ${item.color}`}
              title={`Share on ${item.name}`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span className="hidden md:inline">{item.name}</span>
            </a>
          );
        })}

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-all shadow-2xs active:scale-95 whitespace-nowrap cursor-pointer ml-1"
          title="Copy Link to Clipboard"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>
    </div>
  );
};

export default SocialShareBar;
