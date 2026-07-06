export interface LogoConfig {
  id: string;
  logoUrl: string; // base64 or storage url
  updatedAt: number;
}

export interface WelcomeMessage {
  id: string;
  message: string; // contains {nickname} which will be replaced dynamically
  enabled: boolean;
  createdAt: number;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  imageUrl: string; // base64 or URL
  date: string;
  createdAt: number;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  date: string;
  attachmentUrl?: string;
  pinned: boolean;
  hidden: boolean;
  archived: boolean;
  createdAt: number;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'dropdown'
  | 'date'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'file'
  | 'checkbox'
  | 'radio';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for dropdown, checkbox, radio
  order: number;
}

export interface Submission {
  id: string;
  answers: Record<string, any>; // fieldId -> value
  submittedAt: number;
  visitorNickname: string;
}

export interface GSTPreset {
  id: string; // GST roll number
  answers: Record<string, any>; // fieldId -> value
  updatedAt: number;
}

export interface AdminStats {
  totalVisitors: number;
  totalSubmissions: number;
  totalNotices: number;
  totalMemories: number;
}

export interface VisitorLog {
  id: string;
  nickname: string;
  timestamp: number;
}

export interface SeniorContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  photoUrl: string; // base64 or URL
  createdAt: number;
}
