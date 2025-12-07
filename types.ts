export enum Platform {
  Facebook = 'Facebook',
  Instagram = 'Instagram'
}

export interface SocialPost {
  id: string;
  content: string;
  date: Date; // The start time
  durationMinutes: number;
  platform: Platform;
  mediaUrl?: string;
  isDraft: boolean;
}

export interface CalendarTimeSlot {
  hour: number;
  dayIndex: number; // 0-6 (Sun-Sat) or 1-7 (Mon-Sun) depending on config
  intensity: number; // 0-100, representing "best time" heat
}

export interface ConnectedAccount {
  id: string;
  name: string;
  platform: Platform;
  avatarUrl: string;
  handle: string;
}

export type ViewMode = 'week' | 'month';