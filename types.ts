export enum IntentType {
  CONFESS = 'CONFESS',
  REPAIR = 'REPAIR',
  HELP = 'HELP',
  SUGGEST = 'SUGGEST',
  VENT = 'VENT',
  APPRECIATION = 'APPRECIATION',
  FRIENDSHIP = 'FRIENDSHIP',
  OTHERS = 'OTHERS'
}

export interface IntentConfig {
  type: IntentType;
  label: string;
  icon: string;
  color: string; // Tailwind class
  description: string;
}

export type TargetLanguage = 'English' | 'Chinese' | 'Korean' | 'Japanese';
export type AppLanguage = TargetLanguage;

export type ThemeType = 'Dark' | 'Light' | 'Code' | 'Word' | 'Excel' | 'PowerPoint' | 'WeChat' | 'X';

export interface ThemeConfig {
  id: ThemeType;
  label: string;
  bgClass: string; // Main background
  textClass: string; // Primary text color
  cardClass: string; // Glass card background
  accentColor: string; // Hex for accents
  font: string;
  hideBlobs?: boolean;
}

export interface UserInput {
  intent: IntentType;
  recipient: string; // Who is this for?
  relationship: string; // e.g., Classmate, Best Friend, Ex, Professor
  context: string; // What happened?
  targetLanguage: TargetLanguage;
}

export interface GeneratedMessage {
  tone: 'Warm' | 'Playful' | 'Polite' | 'Direct';
  content: string;
  safetyNote?: string;
}

export interface SafetyAnalysis {
  safe: boolean;
  reason?: string;
  suggestion?: string;
}

export interface FriendshipMission {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Deep';
  description: string;
}

export interface TopicSuggestion {
  category: string;
  starter: string;
}

export interface WallPost {
  id: string;
  content: string;
  intent: IntentType;
  timestamp: number;
  color: string;
  customLabel?: string;
  originalContent?: string; // The raw input, primarily for Venting Wall
}