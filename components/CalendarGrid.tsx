import React, { useMemo, useState, useEffect } from 'react';
import { SocialPost, Platform } from '../types';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Image, Instagram, Facebook, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import styles from './CalendarGrid.module.css';

interface CalendarGridProps {
  currentDate: Date;
  posts: SocialPost[];
  onSlotClick: (date: Date, hour: number) => void;
  onPostClick: (post: SocialPost) => void;
  filteredPlatforms: Platform[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS  = Array.from({ length: 7  }, (_, i) => i);

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  posts,
  onSlotClick,
  onPostClick,
  filteredPlatforms,
}) => {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });

  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos]   = useState<{ top: number; left: number } | null>(null);

  // Close dropdown when clicking anywhere outside
  useEffect(() => {
    const close = () => { setOpenGroupKey(null); setDropdownPos(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const weekDays = useMemo(
    () => DAYS.map(day => addDays(startDate, day)),
    [startDate],
  );

  const heatMap = useMemo(() => {
    const map: Record<string, number> = {};
    DAYS.forEach(dayIndex => {
      HOURS.forEach(hour => {
        if ((hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 20)) {
          map[`${dayIndex}-${hour}`] = 0.2 + Math.random() * 0.3;
        } else if (hour >= 1 && hour <= 5) {
          map[`${dayIndex}-${hour}`] = 0;
        } else {
          map[`${dayIndex}-${hour}`] = 0.05 + Math.random() * 0.1;
        }
      });
    });
    return map;
  }, []);

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case Platform.Instagram: return <Instagram size={14} className="text-[#f5a0b5]" />;
      case Platform.Facebook:  return <Facebook  size={14} className="text-[#7eb3ff]"  />;
      default: return null;
    }
  };

  const getPlatformSmallIcon = (platform: Platform) => {
    switch (platform) {
      case Platform.Instagram: return <Instagram size={10} className="text-[#f5a0b5]" />;
      case Platform.Facebook:  return <Facebook  size={10} className="text-[#7eb3ff]"  />;
      default: return null;
    }
  };

  const getPlatformColor = (platform: Platform) => {
    switch (platform) {
      case Platform.Instagram: return 'bg-[rgba(225,60,100,0.12)] border border-[rgba(225,60,100,0.3)] hover:bg-[rgba(225,60,100,0.18)]';
      case Platform.Facebook:  return 'bg-[rgba(24,114,255,0.15)] border border-[rgba(24,114,255,0.35)] hover:bg-[rgba(24,114,255,0.22)]';
      default: return 'bg-app-surface border border-[rgba(120,140,180,0.14)]';
    }
  };

  const getChipTextColor = (platform: Platform) => {
    switch (platform) {
      case Platform.Facebook:  return 'text-[#7eb3ff]';
      case Platform.Instagram: return 'text-[#f5a0b5]';
      default: return 'text-app-text-2';
    }
  };

  const handleGroupCardClick = (e: React.MouseEvent<HTMLDivElement>, key: string) => {
    e.stopPropagation();
    if (openGroupKey === key) {
      setOpenGroupKey(null);
      setDropdownPos(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
      setOpenGroupKey(key);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent rounded-xl overflow-hidden border border-[rgba(120,140,180,0.14)]">

      {/* ── Header Row ── */}
      <div className={`flex border-b border-[rgba(120,140,180,0.14)] ${styles.headerRow}`}>
        <div className="w-20 flex-shrink-0 border-r border-[rgba(120,140,180,0.14)]" />
        {weekDays.map((date, index) => {
          const isToday = isSameDay(date, new Date());
          return (
            <div key={index} className="flex-1 text-center py-3 border-r border-[rgba(120,140,180,0.14)] last:border-r-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-app-text-3">
                {format(date, 'EEE')}
              </div>
              <div className={`text-xl font-bold mt-1 inline-block w-8 h-8 leading-8 rounded-full ${isToday ? styles.todayBadge : 'text-app-text-2'}`}>
                {format(date, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Grid Body ── */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="flex relative min-h-[1440px]">

          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r border-[rgba(120,140,180,0.14)] sticky left-0 z-10 bg-app-bg">
            {HOURS.map(hour => (
              <div key={hour} className="h-[60px] border-b border-[rgba(120,140,180,0.14)] flex items-start justify-end pr-2 pt-1">
                <span className="font-mono text-[10px] text-app-text-3 select-none leading-none whitespace-nowrap">
                  {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((dayDate, dayIndex) => {
            const dayPosts = posts.filter(p =>
              isSameDay(new Date(p.date), dayDate) && filteredPlatforms.includes(p.platform),
            );

            // Group posts into hour buckets (key = "dayIndex-hour")
            const hourBuckets: Record<string, SocialPost[]> = {};
            dayPosts.forEach(post => {
              const hour = new Date(post.date).getHours();
              const key = `${dayIndex}-${hour}`;
              if (!hourBuckets[key]) hourBuckets[key] = [];
              hourBuckets[key].push(post);
            });

            return (
              <div key={dayIndex} className="flex-1 border-r border-[rgba(120,140,180,0.14)] last:border-r-0 relative">

                {/* Hourly background slots */}
                {HOURS.map(hour => {
                  const isBestTime = (heatMap[`${dayIndex}-${hour}`] ?? 0) >= 0.2;
                  return (
                    <div
                      key={hour}
                      className={`h-[60px] border-b border-[rgba(120,140,180,0.14)] w-full cursor-pointer transition-colors hover:bg-[rgba(120,140,180,0.06)] group relative box-border ${isBestTime ? styles.bestTimeSlot : ''}`}
                      onClick={() => onSlotClick(dayDate, hour)}
                    >
                      <div className="hidden group-hover:flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-app-orange font-bold text-lg">+</span>
                      </div>
                    </div>
                  );
                })}

                {/* Post groups */}
                {Object.entries(hourBuckets).map(([bucketKey, bucketPosts]) => {
                  const sorted = [...bucketPosts].sort(
                    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                  );
                  const firstPost  = sorted[0];
                  const firstDate  = new Date(firstPost.date);
                  const startMins  = firstDate.getHours() * 60 + firstDate.getMinutes();

                  /* ── Single post ── */
                  if (sorted.length === 1) {
                    const chipColor = getChipTextColor(firstPost.platform);
                    return (
                      <div
                        key={bucketKey}
                        onClick={e => { e.stopPropagation(); onPostClick(firstPost); }}
                        className={`absolute left-1 right-1 rounded px-2 py-1.5 text-xs shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] z-20 flex flex-col gap-1 overflow-hidden ${getPlatformColor(firstPost.platform)} ${styles.postCard}`}
                        style={{ '--post-top': `${startMins}px`, '--post-height': `${firstPost.durationMinutes}px` } as React.CSSProperties}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-1 font-semibold ${chipColor}`}>
                            {getPlatformIcon(firstPost.platform)}
                            <span>{format(firstDate, 'h:mm a')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {firstPost.fbPostId && (
                              <span title="Published to Facebook" className="flex items-center gap-0.5 text-[9px] font-semibold text-app-teal bg-[rgba(62,193,166,0.15)] border border-[rgba(62,193,166,0.3)] px-1 py-0.5 rounded">
                                <CheckCircle2 size={8} /> Live
                              </span>
                            )}
                            {firstPost.publishError && !firstPost.fbPostId && (
                              <span title={firstPost.publishError} className="flex items-center gap-0.5 text-[9px] font-semibold text-app-danger bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.25)] px-1 py-0.5 rounded">
                                <AlertCircle size={8} /> Error
                              </span>
                            )}
                            {firstPost.mediaUrl && <Image size={10} className="text-app-text-3" />}
                          </div>
                        </div>
                        <p className={`line-clamp-2 leading-tight ${chipColor}`}>{firstPost.content}</p>
                      </div>
                    );
                  }

                  /* ── Multiple posts — group card ── */
                  const hasError  = sorted.some(p => p.publishError && !p.fbPostId);
                  const liveCount = sorted.filter(p => p.fbPostId).length;
                  const isOpen    = openGroupKey === bucketKey;

                  return (
                    <div
                      key={bucketKey}
                      onClick={e => handleGroupCardClick(e, bucketKey)}
                      className={`absolute left-1 right-1 rounded px-2 py-1.5 text-xs shadow-sm cursor-pointer transition-all hover:shadow-md z-20 overflow-hidden bg-app-surface-2 border ${styles.groupCard} ${
                        isOpen
                          ? 'border-[rgba(255,140,66,0.45)] ring-1 ring-[rgba(255,140,66,0.2)]'
                          : hasError
                          ? 'border-[rgba(255,107,107,0.35)]'
                          : 'border-[rgba(120,140,180,0.25)] hover:border-[rgba(120,140,180,0.45)]'
                      }`}
                      style={{ '--post-top': `${startMins}px` } as React.CSSProperties}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {/* Stacked platform icons */}
                          <div className="flex -space-x-1.5 shrink-0">
                            {sorted.slice(0, 3).map((p, i) => (
                              <div key={i} className="w-4 h-4 rounded-full bg-app-surface-3 ring-1 ring-app-bg flex items-center justify-center">
                                {getPlatformSmallIcon(p.platform)}
                              </div>
                            ))}
                          </div>
                          <span className="font-mono font-semibold text-app-text-3 shrink-0">
                            {format(firstDate, 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasError  && <AlertCircle  size={10} className="text-app-danger" />}
                          {liveCount > 0 && <CheckCircle2 size={10} className="text-app-teal"   />}
                          <span className="font-mono font-semibold text-app-orange-2 bg-[rgba(255,140,66,0.12)] border border-[rgba(255,140,66,0.35)] px-1 py-0.5 rounded text-[9px]">
                            {sorted.length}
                          </span>
                          <ChevronDown
                            size={10}
                            className={`text-app-text-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-app-text-3 mt-0.5 truncate leading-none">
                        {sorted.slice(0, 2).map(p => p.content.substring(0, 18)).join('  ·  ')}
                        {sorted.length > 2 ? `  · +${sorted.length - 2} more` : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Fixed dropdown (renders above all overflow) ── */}
      {openGroupKey && dropdownPos && (() => {
        const [dayStr, hourStr] = openGroupKey.split('-');
        const dayIdx = parseInt(dayStr);
        const hour   = parseInt(hourStr);
        if (dayIdx < 0 || dayIdx >= weekDays.length) return null;

        const groupPosts = posts
          .filter(p =>
            isSameDay(new Date(p.date), weekDays[dayIdx]) &&
            filteredPlatforms.includes(p.platform) &&
            new Date(p.date).getHours() === hour,
          )
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return (
          <div
            className={`fixed z-[300] bg-app-surface border border-[rgba(120,140,180,0.2)] rounded-xl shadow-2xl py-1 min-w-[260px] max-w-[320px] ${styles.dropdown}`}
            style={{ '--dropdown-top': `${dropdownPos.top}px`, '--dropdown-left': `${dropdownPos.left}px` } as React.CSSProperties}
            onClick={e => e.stopPropagation()}
          >
            {/* Dropdown header */}
            <div className="px-3 py-2 border-b border-[rgba(120,140,180,0.14)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-app-text-3">
                {groupPosts.length} posts &middot;&nbsp;
                {format(new Date().setHours(hour, 0, 0, 0), 'h a')} – {format(new Date().setHours(hour + 1, 0, 0, 0), 'h a')}
              </p>
            </div>

            {/* Post rows */}
            {groupPosts.map(post => {
              const postDate  = new Date(post.date);
              const chipColor = getChipTextColor(post.platform);
              return (
                <div
                  key={post.id}
                  onClick={() => { onPostClick(post); setOpenGroupKey(null); setDropdownPos(null); }}
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-app-surface-2 cursor-pointer transition-colors group"
                >
                  <div className="shrink-0">{getPlatformIcon(post.platform)}</div>
                  <span className={`font-mono text-[11px] font-bold shrink-0 ${chipColor}`}>
                    {format(postDate, 'h:mm a')}
                  </span>
                  <span className="text-xs text-app-text-2 line-clamp-1 flex-1 group-hover:text-app-text transition-colors">
                    {post.content}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {post.fbPostId && (
                      <span className="flex items-center gap-0.5 text-[9px] font-semibold text-app-teal bg-[rgba(62,193,166,0.15)] border border-[rgba(62,193,166,0.3)] px-1 py-0.5 rounded">
                        <CheckCircle2 size={8} /> Live
                      </span>
                    )}
                    {post.publishError && !post.fbPostId && (
                      <span title={post.publishError} className="flex items-center gap-0.5 text-[9px] font-semibold text-app-danger bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.25)] px-1 py-0.5 rounded">
                        <AlertCircle size={8} /> Error
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

    </div>
  );
};
