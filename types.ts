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
  fbPostId?: string;      // Set when successfully published to Facebook
  publishError?: string;  // Set when publishing failed
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

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  picture?: { data: { url: string } };
}