/**
 * Sound Manager - Handles all audio functionality
 */
import { GAME_CONFIG } from './constants.js';

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.sounds = {
      correct: new Audio(GAME_CONFIG.AUDIO_PATHS.correct),
      timeup: new Audio(GAME_CONFIG.AUDIO_PATHS.timeup)
    };
  }

  /**
   * Initialize audio context
   */
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    // Preload sounds
    this.sounds.correct.load();
    this.sounds.timeup.load();
  }

  /**
   * Toggle sound on/off
   * @param {HTMLElement} button - Sound button element to update
   */
  toggle(button) {
    this.enabled = !this.enabled;
    if (button) {
      button.textContent = this.enabled ? '🔊' : '🔇';
    }
    if (this.enabled) {
      this.init();
    }
  }

  /**
   * Play a tone using Web Audio API
   * @param {number} freq - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {string} type - Oscillator type ('sine', 'square', 'sawtooth', 'triangle')
   */
  playTone(freq, duration, type = 'sine') {
    if (!this.enabled || !this.ctx) return;
    
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error('Audio Error:', e);
    }
  }

  /**
   * Play a named sound effect
   * @param {string} name - Sound name ('correct' or 'timeup')
   */
  playSound(name) {
    if (!this.enabled) return;
    
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => {
        console.log('Audio play failed, falling back to beep:', e);
        // Fallback to tone
        if (name === 'correct') this.playTone(600, 0.1, 'sine');
        if (name === 'timeup') this.playTone(80, 1.0, 'sawtooth');
      });
    }
  }

  /**
   * Play countdown beep
   */
  countdownBeep() {
    this.playTone(600, 0.1, 'sine');
  }

  /**
   * Play "go" beep
   */
  goBeep() {
    this.playTone(800, 0.3, 'square');
  }

  /**
   * Play correct answer sound
   */
  playCorrect() {
    this.playSound('correct');
  }

  /**
   * Play time's up sound
   */
  playTimeUp() {
    this.playSound('timeup');
  }
}
