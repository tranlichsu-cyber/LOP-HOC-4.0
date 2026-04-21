import { Student, Badge } from '../types';

export const XP_PER_LEVEL = 1000;

export const calculateLevel = (xp: number) => {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
};

export const getProgressToNextLevel = (xp: number) => {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
};

export const BADGES_LIST: Omit<Badge, 'unlockedAt'>[] = [
  { id: 'first_game', name: 'Người Khởi Đầu', icon: '🌱', description: 'Hoàn thành trò chơi đầu tiên' },
  { id: 'streak_3', name: 'Chăm Chỉ', icon: '🔥', description: 'Học tập 3 ngày liên tiếp' },
  { id: 'math_master', name: 'Bậc Thầy Toán Học', icon: '🔢', description: 'Đạt điểm tuyệt đối trong 5 trò chơi Toán' },
  { id: 'wise_one', name: 'Nhà Thông Thái', icon: '🧠', description: 'Trả lời đúng 50 câu hỏi AI' },
  { id: 'top_1', name: 'Vô Địch', icon: '🏆', description: 'Đoạt hạng 1 trong một trận Đua Top' }
];

export const checkAwards = (student: Student, action: { type: string, payload?: any }): Badge[] => {
  const newBadges: Badge[] = [];
  const currentBadgeIds = student.badges.map(b => b.id);

  if (action.type === 'complete_game' && !currentBadgeIds.includes('first_game')) {
    const b = BADGES_LIST.find(b => b.id === 'first_game');
    if (b) newBadges.push({ ...b, unlockedAt: new Date().toISOString() });
  }

  // More logic can be added here
  return newBadges;
};
