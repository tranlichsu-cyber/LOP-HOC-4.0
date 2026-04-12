export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  schoolId?: string;
  classId?: string;
}

export interface School {
  id: string;
  name: string;
  address?: string;
  adminUid: string;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  teacherUid: string;
  schoolId: string;
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'essay';
  text: string;
  mediaUrl?: string;
  options?: string[];
  correct?: number;
  timeLimit?: number; // seconds
}

export interface Game {
  id: string;
  title: string;
  type: 'math' | 'millionaire' | 'race' | 'wise_one' | 'matching' | 'memory' | 'word_search' | 'word_link' | 'crossword';
  questionsList: Question[];
  plays?: number;
  timeLimit?: number; // default for all questions
}

export interface Student {
  id: string;
  name: string;
  user: string;
  passHash: string;
}

export interface Homework {
  id: string;
  title: string;
  dueDate: string;
  mode: 'home' | 'class';
  questions: Question[];
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
  content: string;
  createdAt: string;
}

export interface Worksheet {
  id: string;
  title: string;
  subject: string;
  grade: string;
  content: string;
  createdAt: string;
}

export interface GameSession {
  id: string;
  gameId: string;
  teacherUid: string;
  pin: string;
  status: 'waiting' | 'playing' | 'finished';
  currentQuestionIndex: number;
  scores: { [studentUid: string]: { name: string, score: number } };
  createdAt: string;
}
