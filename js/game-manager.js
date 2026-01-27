/**
 * Game Manager - Core game logic and state management
 */
import { GAME_CONFIG } from './constants.js';
import { shuffleArray } from './utils.js';

export class GameManager {
  constructor(uiManager, soundManager, cardData) {
    this.ui = uiManager;
    this.sound = soundManager;
    this.cardData = cardData;
    
    // Game state
    this.state = GAME_CONFIG.STATES.WELCOME;
    this.roundDuration = GAME_CONFIG.DEFAULT_ROUND_DURATION;
    this.roundScore = 0;
    this.timeLeft = this.roundDuration;
    this.countdownTime = GAME_CONFIG.COUNTDOWN_DURATION;
    
    // Timers
    this.timerInterval = null;
    this.countdownInterval = null;
    
   // Cards
    this.shuffledCards = [];
    this.currentCardIndex = 0;
    this.roundCards = [];
    
    // Teams
    this.numberOfTeams = 0;
    this.teams = [];
    this.currentTeamIndex = 0;
    this.totalRoundsCompleted = 0;
    
    // Deck selection
    this.selectedDecks = new Set(['naija']);
    
    // Pause state
    this.isPaused = false;
    this.pauseOverlay = document.getElementById('pause-overlay');
  }

  /**
   * Set the round duration
   * @param {number} duration - Duration in seconds
   */
  setRoundDuration(duration) {
    this.roundDuration = duration;
  }

  /**
   * Toggle deck selection
   * @param {string} deck - Deck name ('naija' or 'global')
   */
  toggleDeck(deck) {
    if (this.selectedDecks.has(deck)) {
      if (this.selectedDecks.size > 1) {
        this.selectedDecks.delete(deck);
        return true;
      }
      return false; // Can't deselect last deck
    } else {
      this.selectedDecks.add(deck);
      return true;
    }
  }

  /**
   * Setup teams and start game
   * @param {number} teamCount - Number of teams
   */
  setupAndStartGame(teamCount) {
    this.numberOfTeams = teamCount;
    this.teams = [];
    
    for (let i = 0; i < this.numberOfTeams; i++) {
      this.teams.push({
        name: `Team ${i + 1}`,
        score: 0,
        color: GAME_CONFIG.TEAM_COLORS[i]
      });
    }
    
    this.currentTeamIndex = 0;
    this.totalRoundsCompleted = 0;
    
    // Filter and shuffle cards based on selected decks
    const activeCards = [];
    this.selectedDecks.forEach(deck => {
      if (this.cardData[deck]) {
        activeCards.push(...this.cardData[deck].map(card => ({
          ...card,
          category: deck
        })));
      }
    });
    
    if (activeCards.length === 0) {
      alert('Please select at least one deck!');
      return;
    }
    
    this.shuffledCards = shuffleArray(activeCards);
    this.currentCardIndex = 0;
    
    this.startCountdown();
  }

  /**
   * Start countdown before round
   */
  startCountdown() {
    this.state = GAME_CONFIG.STATES.GET_READY;
    this.countdownTime = GAME_CONFIG.COUNTDOWN_DURATION;
    
    const currentTeam = this.teams[this.currentTeamIndex];
    this.ui.updateCountdown(this.countdownTime, currentTeam.name);
    this.ui.renderScreen(this.state);
    
    clearInterval(this.countdownInterval);
    this.sound.countdownBeep();
    
    this.countdownInterval = setInterval(() => {
      this.countdownTime--;
      this.ui.updateCountdown(this.countdownTime, currentTeam.name);
      
      if (this.countdownTime > 0) {
        this.sound.countdownBeep();
      }
      
      if (this.countdownTime <= 0) {
        clearInterval(this.countdownInterval);
        this.sound.goBeep();
        this.startRound();
      }
    }, 1000);
  }

  /**
   * Skip countdown and start round immediately
   */
  skipCountdown() {
    clearInterval(this.countdownInterval);
    this.startRound();
  }

  /**
   * Start a game round
   */
  startRound() {
    this.state = GAME_CONFIG.STATES.PLAYING;
    this.isPaused = false;
    
    if (this.pauseOverlay) {
      this.pauseOverlay.style.display = 'none';
    }
    
    this.roundCards = [];
    this.roundScore = 0;
    this.timeLeft = this.roundDuration;
    
    const currentTeam = this.teams[this.currentTeamIndex];
    this.ui.updateScore(this.roundScore);
    this.ui.updateTimer(this.timeLeft);
    this.ui.updateTeamIndicator(currentTeam.name, currentTeam.color);
    this.ui.renderScreen(this.state);
    this.updateCard();
    
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  /**
   * Update timer each second
   */
  updateTimer() {
    if (this.isPaused) return;
    
    this.timeLeft--;
    this.ui.updateTimer(this.timeLeft);
    
    if (this.timeLeft <= 0) {
      this.sound.playTimeUp();
      this.showReviewScreen();
    }
  }

  /**
   * Update card display
   */
  updateCard() {
    const card = this.shuffledCards[this.currentCardIndex];
    
    if (!card) {
      this.endRound();
      return;
    }
    
    this.ui.updateCard(card);
  }

  /**
   * Move to next card
   */
  nextCard() {
    this.currentCardIndex++;
    
    // Reshuffle if we run out of cards
    if (this.currentCardIndex >= this.shuffledCards.length) {
      const activeCards = [];
      this.selectedDecks.forEach(deck => {
        if (this.cardData[deck]) {
          activeCards.push(...this.cardData[deck].map(card => ({
            ...card,
            category: deck
          })));
        }
      });
      this.shuffledCards = shuffleArray(activeCards);
      this.currentCardIndex = 0;
    }
    
    this.updateCard();
  }

  /**
   * Handle correct answer
   */
  handleCorrect() {
    const card = this.shuffledCards[this.currentCardIndex];
    if (!card) return;
    
    this.roundCards.push({
      word: card.targetWord,
      status: 'correct'
    });
    
    this.roundScore++;
    this.ui.updateScore(this.roundScore);
    this.sound.playCorrect();
    this.nextCard();
  }

  /**
   * Handle pass
   */
  handlePass() {
    const card = this.shuffledCards[this.currentCardIndex];
    if (!card) return;
    
    this.roundCards.push({
      word: card.targetWord,
      status: 'skipped'
    });
    
    this.nextCard();
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.state !== GAME_CONFIG.STATES.PLAYING) return;
    
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      clearInterval(this.timerInterval);
      if (this.pauseOverlay) {
        this.pauseOverlay.style.display = 'flex';
      }
    } else {
      if (this.pauseOverlay) {
        this.pauseOverlay.style.display = 'none';
      }
      this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
  }

  /**
   * Show review screen
   */
  showReviewScreen() {
    this.state = GAME_CONFIG.STATES.REVIEW;
    clearInterval(this.timerInterval);
    this.ui.renderScreen(this.state);
    this.ui.showReviewScreen(this.roundCards, (index) => this.toggleCardStatus(index));
  }

  /**
   * Toggle card status in review
   * @param {number} index - Card index
   */
  toggleCardStatus(index) {
    const item = this.roundCards[index];
    if (item) {
      item.status = item.status === 'correct' ? 'skipped' : 'correct';
      this.ui.showReviewScreen(this.roundCards, (i) => this.toggleCardStatus(i));
    }
  }

  /**
   * Confirm score and end round
   */
  confirmScore() {
    this.roundScore = this.roundCards.filter(c => c.status === 'correct').length;
    this.endRound();
  }

  /**
   * End the current round
   */
  endRound() {
    clearInterval(this.timerInterval);
    this.teams[this.currentTeamIndex].score += this.roundScore;
    this.currentTeamIndex = (this.currentTeamIndex + 1) % this.numberOfTeams;
    this.totalRoundsCompleted++;
    
    // Check if game is over
    if (this.totalRoundsCompleted >= this.numberOfTeams * GAME_CONFIG.MAX_ROUNDS_PER_TEAM) {
      this.showFinalWinner();
      return;
    }
    
    this.state = GAME_CONFIG.STATES.ROUND_OVER;
    this.ui.updateScoreboard(this.teams);
    this.ui.renderScreen(this.state);
    
    // Update next round button text
    const nextRoundBtn = document.getElementById('next-round-btn');
    if (nextRoundBtn) {
      const nextTeamName = this.teams[this.currentTeamIndex].name;
      const currentRound = Math.floor(this.totalRoundsCompleted / this.numberOfTeams) + 1;
      nextRoundBtn.textContent = 
        `Start ${nextTeamName}'s Turn (Round ${currentRound}/${GAME_CONFIG.MAX_ROUNDS_PER_TEAM})`;
    }
  }

  /**
   * Show final winner screen
   */
  showFinalWinner() {
    this.state = GAME_CONFIG.STATES.GAME_OVER;
    this.ui.updateFinalScoreboard(this.teams);
    this.ui.renderScreen(this.state);
  }

  /**
   * Reset game to team selection
   */
  resetGame() {
    clearInterval(this.timerInterval);
    clearInterval(this.countdownInterval);
    this.state = GAME_CONFIG.STATES.TEAM_SELECTION;
    this.totalRoundsCompleted = 0;
    this.ui.renderScreen(this.state);
  }

  /**
   * Quit game and return to welcome screen
   */
  quitGame() {
    if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
      clearInterval(this.timerInterval);
      clearInterval(this.countdownInterval);
      this.isPaused = false;
      
      if (this.pauseOverlay) {
        this.pauseOverlay.style.display = 'none';
      }
      
      this.state = GAME_CONFIG.STATES.WELCOME;
      this.totalRoundsCompleted = 0;
      this.currentCardIndex = 0;
      this.roundScore = 0;
      this.ui.renderScreen(this.state);
    }
  }
}
