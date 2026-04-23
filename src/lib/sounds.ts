/**
 * Utility for playing game sounds
 */

const SOUND_URLS = {
  spin: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/bonus.wav',
  winner: 'https://codeskulptor-demos.commondatastorage.googleapis.com/SoundDocs/paws.wav',
  correct: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  click: 'https://codeskulptor-demos.commondatastorage.googleapis.com/SoundDocs/paws.wav',
  countdown: 'https://codeskulptor-demos.commondatastorage.googleapis.com/SoundDocs/tick.wav',
  applause: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/bonus.wav',
  race: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/bonus.wav',
  bg_music: 'https://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3',
  game_over: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3'
};

export type SoundType = keyof typeof SOUND_URLS;

let bgAudio: HTMLAudioElement | null = null;

export const playSound = (type: SoundType) => {
  try {
    const audio = new Audio(SOUND_URLS[type]);
    audio.volume = 0.4;
    audio.play().catch(err => console.warn("Audio playback failed (likely user interaction required):", err));
  } catch (error) {
    console.error("Error playing sound:", error);
  }
};

export const startBackgroundMusic = () => {
  if (bgAudio) return;
  try {
    bgAudio = new Audio(SOUND_URLS.bg_music);
    bgAudio.volume = 0.2;
    bgAudio.loop = true;
    bgAudio.play().catch(err => console.warn("Background music failed to start:", err));
  } catch (error) {
    console.error("Error starting background music:", error);
  }
};

export const stopBackgroundMusic = () => {
  if (bgAudio) {
    bgAudio.pause();
    bgAudio = null;
  }
};

/**
 * Text-to-Speech using Web Speech API
 */
export const speakText = (text: string, language: string = 'vi-VN') => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  
  // Stop any current speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 1.0;
  utterance.pitch = 1.1; // Slightly higher pitch for kids
  
  window.speechSynthesis.speak(utterance);
};
