import React from 'react';
import { ThumbsUp, MessageCircle, Share2, Globe, Heart, Bookmark, Send, MoreHorizontal } from 'lucide-react';
import { Platform } from '../types';
import styles from './PostPreviewCard.module.css';

const BACKGROUNDS = [
  { id: 'none',   class: 'bg-white' },
  { id: 'purple', class: 'bg-fuchsia-700' },
  { id: 'red',    class: 'bg-red-600' },
  { id: 'black',  class: 'bg-gray-900' },
  { id: 'grad-1', class: 'bg-gradient-to-br from-pink-500 to-purple-600' },
  { id: 'grad-2', class: 'bg-gradient-to-br from-violet-600 to-indigo-600' },
  { id: 'grad-3', class: 'bg-gradient-to-br from-orange-400 to-pink-500' },
  { id: 'grad-4', class: 'bg-gradient-to-br from-slate-800 to-black' },
  { id: 'grad-5', class: 'bg-gradient-to-br from-indigo-900 to-purple-900' },
];

interface PostPreviewCardProps {
  platform: Platform;
  postType: 'Feed' | 'Reel' | 'Story';
  content: string;
  selectedBackground: string;
  mediaPreviewUrl: string | null;
  mediaType?: string;
  date: string;
  time: string;
}

const Avatar: React.FC<{ size?: string }> = ({ size = 'w-10 h-10' }) => (
  <div className={`${size} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
    YP
  </div>
);

export const PostPreviewCard: React.FC<PostPreviewCardProps> = ({
  platform,
  postType,
  content,
  selectedBackground,
  mediaPreviewUrl,
  mediaType,
  date,
  time,
}) => {
  const isVideo = mediaType?.startsWith('video/') ?? false;
  const activeBg    = BACKGROUNDS.find(b => b.id === selectedBackground) || BACKGROUNDS[0];
  const isColoredBg = platform === Platform.Facebook && postType === 'Feed' && selectedBackground !== 'none';
  const isFacebook  = platform === Platform.Facebook;

  // Mirrors the compose box ladder, scaled down for the narrower preview column
  const getPreviewFontSize = (len: number) => {
    if (len < 40) return 'text-2xl';
    if (len < 85) return 'text-lg';
    return 'text-sm';
  };

  const previewDate = date && time ? new Date(`${date}T${time}`) : new Date();
  const formattedDate = previewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTime = previewDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  /* ── Reel / Story ── */
  if (postType === 'Reel' || postType === 'Story') {
    return (
      <div className="flex flex-col items-center gap-3">
        {/* Phone-like vertical frame */}
        <div className={`w-48 relative overflow-hidden shadow-2xl ${styles.reelFrame}`}>
          {mediaPreviewUrl ? (
            isVideo
              ? <video src={mediaPreviewUrl} className="w-full h-full object-cover" muted playsInline />
              : <img src={mediaPreviewUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-700 to-slate-900">
              <p className="text-white/30 text-[11px] text-center px-6 leading-relaxed">
                Upload media to see your {postType} preview
              </p>
            </div>
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />

          {/* Top bar — profile */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Avatar size="w-6 h-6" />
              <span className="text-white text-[11px] font-semibold drop-shadow-sm">Your Page</span>
              <span className="text-white/50 text-[9px]">· Follow</span>
            </div>
            <MoreHorizontal size={14} className="text-white/60" />
          </div>

          {/* Content text */}
          {content && (
            <div className="absolute bottom-16 left-3 right-10">
              <p className="text-white text-[11px] leading-snug line-clamp-3">{content}</p>
            </div>
          )}

          {/* Side actions */}
          <div className="absolute right-2 bottom-14 flex flex-col items-center gap-3.5">
            {[
              { Icon: Heart, label: '0' },
              { Icon: MessageCircle, label: '0' },
              { Icon: Send, label: null },
              { Icon: Bookmark, label: null },
            ].map(({ Icon, label }, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <Icon size={18} className="text-white drop-shadow" />
                {label !== null && <span className="text-white text-[9px]">{label}</span>}
              </div>
            ))}
          </div>

          {/* Bottom audio strip */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex-shrink-0 border border-white/30" />
            <span className="text-white/50 text-[9px] truncate">♫ Original Audio</span>
          </div>
        </div>

        <span className="font-mono text-[10px] text-app-text-3 uppercase tracking-widest">
          {postType} · 9:16
        </span>
      </div>
    );
  }

  /* ── Feed Post ── */
  return (
    <div className={styles.feedCard}>

      {/* Card header */}
      <div className="px-4 py-3 flex items-start gap-3">
        <Avatar />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-[13px] leading-none ${styles.pageName}`}>Your Page</p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[11px] ${styles.metaText}`}>{formattedDate} · {formattedTime}</span>
            <Globe size={10} className={`flex-shrink-0 ${styles.metaText}`} />
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 border ${
          isFacebook
            ? 'bg-[rgba(24,114,255,0.15)] border-[rgba(24,114,255,0.3)] text-[#7eb3ff]'
            : 'bg-[rgba(225,60,100,0.12)] border-[rgba(225,60,100,0.3)] text-[#f5a0b5]'
        }`}>
          {isFacebook ? 'FB' : 'IG'}
        </span>
      </div>

      {/* Plain text content (no colored bg) */}
      {!isColoredBg && content && (
        <div className="px-4 pb-3">
          <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${styles.bodyText}`}>{content}</p>
        </div>
      )}

      {/* Colored background or media */}
      {isColoredBg && content ? (
        <div className={`flex items-center justify-center px-6 ${activeBg.class} ${styles.coloredBgBlock}`}>
          <p className={`font-bold text-center text-white leading-snug break-words ${getPreviewFontSize(content.length)}`}>
            {content}
          </p>
        </div>
      ) : mediaPreviewUrl ? (
        <div className={styles.mediaBlock}>
          {isVideo
            ? <video src={mediaPreviewUrl} className="w-full h-full object-cover" muted playsInline />
            : <img src={mediaPreviewUrl} alt="" className="w-full h-full object-cover" />}
        </div>
      ) : null}

      {/* Empty state hint */}
      {!isColoredBg && !content && !mediaPreviewUrl && (
        <div className="px-4 pb-4">
          <p className={`text-[12px] italic ${styles.emptyText}`}>Your post content will appear here...</p>
        </div>
      )}

      {/* Engagement row */}
      <div className="px-4 py-2.5 flex items-center gap-4 border-t border-[rgba(255,255,255,0.08)]">
        {[
          { Icon: ThumbsUp, label: 'Like' },
          { Icon: MessageCircle, label: 'Comment' },
        ].map(({ Icon, label }) => (
          <button key={label} type="button" className={`flex items-center gap-1.5 text-[12px] font-medium ${styles.engageBtn}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
        <button type="button" className={`flex items-center gap-1.5 text-[12px] font-medium ml-auto ${styles.engageBtn}`}>
          <Share2 size={13} /> Share
        </button>
      </div>
    </div>
  );
};
