/**
 * Sound Service for EduPro
 * Manages sound effects and Text-to-Speech (TTS)
 */

class AudioService {
  private sounds: Record<string, HTMLAudioElement> = {};
  private muted: boolean = false;

  constructor() {
    // Preload basic sounds (standard public assets)
    if (typeof window !== 'undefined') {
      this.sounds['correct'] = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      this.sounds['wrong'] = new Audio('https://assets.mixkit.co/active_storage/sfx/2959/2959-preview.mp3');
      this.sounds['levelup'] = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
      this.sounds['click'] = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  }

  play(soundName: 'correct' | 'wrong' | 'levelup' | 'click') {
    if (this.muted) return;
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.warn('Audio play failed:', e));
    }
  }

  setMuted(mute: boolean) {
    this.muted = mute;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Text-to-Speech using Web Speech API
   */
  speak(text: string, language: string = 'vi-VN') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Slightly higher pitch for kids
    
    window.speechSynthesis.speak(utterance);
  }
}

export const audioService = new AudioService();
