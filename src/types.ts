export type UserRole = 'school_admin' | 'principal' | 'teacher' | 'homeroom_teacher' | 'student' | 'parent';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  schoolId?: string;
  classId?: string;
  studentIds?: string[]; // For parents to track multiple children
}

export interface Parent {
  id: string; // matches UserProfile.uid
  name: string;
  phoneNumber: string;
  childrenIds: string[]; // references Student.id or Student.user
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
  subject?: string;
  grade?: string;
  type: 'math' | 'millionaire' | 'race' | 'wise_one' | 'matching' | 'memory' | 'word_search' | 'word_link' | 'crossword' | 'drag_drop';
  questionsList: Question[];
  plays?: number;
  timeLimit?: number; // default for all questions
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt: string;
}

export interface Student {
  id: string;
  name: string;
  user: string;
  passHash: string;
  avatar?: string;
  schoolId?: string;
  classId?: string;
  xp?: number;
  level?: number;
  badges?: Badge[];
  streak?: number;
  lastActive?: string;
}

export interface Homework {
  id: string;
  title: string;
  subject?: string;
  dueDate: string;
  mode: 'home' | 'class';
  questions: Question[];
  feedback?: { [studentUid: string]: string };
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

export type ResourceType = 'lesson_plan' | 'exam' | 'question_bank' | 'powerpoint' | 'video' | 'stem' | 'review_material';

export interface DigitalResource {
  id: string;
  title: string;
  type: ResourceType;
  subject: string;
  grade: string;
  authorId: string;
  authorName: string;
  schoolId: string;
  departmentId?: string;
  fileUrl?: string; // Link to the actual file
  content?: string; // For text-based resources
  createdAt: string;
  isPublic: boolean;
  downloads?: number;
}

export interface Department {
  id: string;
  name: string;
  schoolId: string;
  memberIds: string[];
}

export interface GameSession {
  id: string;
  gameId: string;
  teacherUid: string;
  pin: string;
  status: 'waiting' | 'playing' | 'finished';
  currentQuestionIndex: number;
  scores: { [studentUid: string]: { name: string, score: number, avatar?: string } };
  createdAt: string;
}
