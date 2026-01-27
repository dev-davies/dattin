/**
 * Game Configuration Constants
 */
export const GAME_CONFIG = {
  // Timer Durations
  COUNTDOWN_DURATION: 10,
  DEFAULT_ROUND_DURATION: 30,
  
  // Game Rules
  MAX_ROUNDS_PER_TEAM: 3,
  
  // Team Colors
  TEAM_COLORS: [
    'var(--team1-color)', // blue
    'var(--team2-color)', // pink
    'var(--team3-color)', // orange
    'var(--team4-color)'  // violet
  ],
  
  // Audio Paths
  AUDIO_PATHS: {
    correct: './assets/sounds/correct.mp3',
    timeup: './assets/sounds/timeup.mp3'
  },
  
  // Game States
  STATES: {
    WELCOME: 'WELCOME',
    TEAM_SELECTION: 'TEAM_SELECTION',
    GET_READY: 'GET_READY',
    PLAYING: 'PLAYING',
    REVIEW: 'REVIEW',
    ROUND_OVER: 'ROUND_OVER',
    GAME_OVER: 'GAME_OVER'
  }
};
