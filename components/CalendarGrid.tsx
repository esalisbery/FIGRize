import React, { useMemo } from 'react';
import { SocialPost, Platform } from '../types';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Image, Instagram, Facebook } from 'lucide-react';

interface CalendarGridProps {
  currentDate: Date;
  posts: SocialPost[];
  onSlotClick: (date: Date, hour: number) => void;
  onPostClick: (post: SocialPost) => void;
  filteredPlatforms: Platform[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = Array.from({ length: 7 }, (_, i) => i);

export const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  currentDate, 
  posts, 
  onSlotClick,
  onPostClick,
  filteredPlatforms 
}) => {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday

  const weekDays = useMemo(() => {
    return DAYS.map(day => addDays(startDate, day));
  }, [startDate]);

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
    switch(platform) {
      case Platform.Instagram: return <Instagram size={14} className="text-pink-600" />;
      case Platform.Facebook: return <Facebook size={14} className="text-blue-600" />;
      default: return null;
    }
  };

  const getPlatformColor = (platform: Platform) => {
    switch(platform) {
      case Platform.Instagram: return 'bg-pink-50 border-pink-200 hover:bg-pink-100';
      case Platform.Facebook: return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Row (Days) */}
      <div className="flex border-b border-gray-200">
        <div className="w-14 flex-shrink-0 bg-gray-50 border-r border-gray-200" /> {/* Time column header */}
        {weekDays.map((date, index) => {
            const isToday = isSameDay(date, new Date());
            return (
                <div key={index} className="flex-1 text-center py-3 border-r border-gray-100 last:border-r-0 bg-gray-50">
                    <div className="text-xs font-semibold text-gray-500 uppercase">{format(date, 'EEE')}</div>
                    <div className={`text-xl font-bold mt-1 inline-block w-8 h-8 leading-8 rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-800'}`}>
                    {format(date, 'd')}
                    </div>
                </div>
            )
        })}
      </div>

      {/* Grid Body */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="flex relative min-h-[1440px]"> {/* 24 hours * 60px height */}
          
          {/* Time Labels Column */}
          <div className="w-14 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col sticky left-0 z-10">
            {HOURS.map(hour => (
              <div key={hour} className="h-[60px] text-xs font-bold text-gray-600 text-right pr-2 pt-1 border-b border-gray-50 relative">
                <span className="-top-2.5 relative bg-white pl-1">
                    {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </span>
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {weekDays.map((dayDate, dayIndex) => (
            <div key={dayIndex} className="flex-1 border-r border-gray-100 last:border-r-0 relative">
              {/* Hourly Slots background */}
              {HOURS.map(hour => {
                return (
                  <div
                    key={hour}
                    className="h-[60px] border-b border-gray-100 w-full cursor-pointer transition-colors hover:bg-indigo-50/50 group relative"
                    style={{ backgroundColor: `rgba(235, 230, 255, ${heatMap[`${dayIndex}-${hour}`] || 0})` }}
                    onClick={() => onSlotClick(dayDate, hour)}
                  >
                    {/* Hover + Button */}
                    <div className="hidden group-hover:flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-indigo-600 font-bold text-lg">+</span>
                    </div>
                  </div>
                );
              })}

              {/* Render Posts for this day */}
              {posts
                .filter(post => isSameDay(new Date(post.date), dayDate) && filteredPlatforms.includes(post.platform))
                .map(post => {
                  const date = new Date(post.date);
                  const startMinutes = date.getHours() * 60 + date.getMinutes();
                  // 1 hour = 60px height. 1 minute = 1px height
                  return (
                    <div
                      key={post.id}
                      onClick={(e) => { e.stopPropagation(); onPostClick(post); }}
                      className={`absolute left-1 right-1 rounded px-2 py-1.5 text-xs border shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] z-20 flex flex-col gap-1 overflow-hidden ${getPlatformColor(post.platform)}`}
                      style={{
                        top: `${startMinutes}px`,
                        height: `${post.durationMinutes}px`, // Assume 1px per min for now
                      }}
                    >
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-1 font-semibold text-gray-700">
                           {getPlatformIcon(post.platform)}
                           <span>{format(date, 'HH:mm')}</span>
                         </div>
                         {post.mediaUrl ? <Image size={10} className="text-gray-500"/> : null}
                      </div>
                      <p className="line-clamp-2 text-gray-600 leading-tight">
                        {post.content}
                      </p>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};