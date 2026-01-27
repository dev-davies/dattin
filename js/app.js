/**
 * Dat Tin - Main Application Entry Point
 */
import { GameManager } from './game-manager.js';
import { UIManager } from './ui-manager.js';
import { SoundManager } from './sound-manager.js';
import { loadCards, getElement, getElements } from './utils.js';

// Global reference for toggleCardStatus (called from HTML onclick)
window.toggleCardStatus = null;

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Load card data
  const cardData = await loadCards();
  
  // Initialize managers
  const soundManager = new SoundManager();
  const uiManager = new UIManager();
  const game = new GameManager(uiManager, soundManager, cardData);
  
  // Expose toggleCardStatus to window for HTML onclick handlers
  window.toggleCardStatus = (index) => game.toggleCardStatus(index);
  
  // Setup event listeners
  setupEventListeners(game, soundManager);
  
  // Initialize PWA
  initializePWA();
  
  // Render initial screen
  uiManager.renderScreen(game.state);
});

/**
 * Setup all event listeners
 * @param {GameManager} game - Game manager instance
 * @param {SoundManager} soundManager - Sound manager instance
 */
function setupEventListeners(game, soundManager) {
  // Button action mappings
  const actions = {
    'play-now-btn': () => {
      soundManager.init(); // Initialize audio on user gesture
      game.state = 'TEAM_SELECTION';
      game.ui.renderScreen(game.state);
    },
    'next-round-btn': () => game.startCountdown(),
    'new-game-btn': () => game.resetGame(),
    'play-again-btn': () => game.resetGame(),
    'skip-countdown-btn': () => game.skipCountdown(),
    'correct-btn': () => game.handleCorrect(),
    'pass-btn': () => game.handlePass(),
    'sound-btn': (e) => soundManager.toggle(e.target),
    'confirm-score-btn': () => game.confirmScore(),
    'pause-btn': () => game.togglePause(),
    'resume-btn': () => game.togglePause(),
    'quit-game-btn': () => game.quitGame(),
    'quit-pause-btn': () => game.quitGame()
  };

  // Attach event listeners
  Object.entries(actions).forEach(([id, fn]) => {
    const element = getElement(id);
    if (element) {
      element.addEventListener('click', fn);
    }
  });

  // Team count buttons
  getElements('.team-count-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const teamCount = parseInt(e.target.dataset.teams);
      game.setupAndStartGame(teamCount);
    });
  });

  // Deck selection buttons
  getElements('.deck-option').forEach(option => {
    option.addEventListener('click', (e) => {
      const deck = e.currentTarget.dataset.deck;
      const success = game.toggleDeck(deck);
      
      if (success) {
        e.currentTarget.classList.toggle('selected');
      }
    });
  });

  // Timer duration buttons
  getElements('.timer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove selected from all
      getElements('.timer-btn').forEach(b => b.classList.remove('selected'));
      
      // Add selected to clicked
      e.target.classList.add('selected');
      
      // Update game round duration
      const duration = parseInt(e.target.dataset.time);
      game.setRoundDuration(duration);
    });
  });
}

/**
 * Initialize PWA (Progressive Web App) functionality
 */
function initializePWA() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.log('Service worker registration failed:', err));
  }

  // Install prompt logic
  let deferredPrompt;
  const prompt = getElement('install-prompt');
  const installBtn = getElement('install-btn');
  const closeBtn = getElement('close-install-btn');

  if (!prompt || !installBtn || !closeBtn) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    prompt.classList.add('visible');
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      deferredPrompt = null;
    }
    
    prompt.classList.remove('visible');
  });

  closeBtn.addEventListener('click', () => {
    prompt.classList.remove('visible');
  });
}
