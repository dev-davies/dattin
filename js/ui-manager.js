/**
 * UI Manager - Handles all UI updates and rendering
 */
import { GAME_CONFIG } from './constants.js';
import { animateElement, getElement, getElements } from './utils.js';

export class UIManager {
  constructor() {
    this.screens = {
      welcome: getElement('welcome-screen'),
      teamSelection: getElement('team-selection-screen'),
      game: getElement('game-screen'),
      roundOver: getElement('round-over-screen'),
      gameOver: getElement('game-over-screen'),
      getReady: getElement('get-ready-screen'),
      review: getElement('review-screen')
    };

    this.displays = {
      score: getElement('score'),
      timer: getElement('timer'),
      targetWord: getElement('target-word'),
      forbiddenWordsList: getElement('forbidden-words-list'),
      gameCard: getElement('game-card'),
      currentTeamIndicator: getElement('current-team-indicator'),
      scoreboard: getElement('scoreboard'),
      winnerTeamName: getElement('winner-team-name'),
      winnerTeamScore: getElement('winner-team-score'),
      winnerDisplay: getElement('winner-display'),
      finalWinnerTeamName: getElement('final-winner-team-name'),
      finalWinnerTeamScore: getElement('final-winner-team-score'),
      finalScoreboard: getElement('final-scoreboard'),
      countdownNumber: getElement('countdown-number'),
      countdownMessage: getElement('countdown-message')
    };
  }

  /**
   * Render the appropriate screen based on game state
   * @param {string} gameState - Current game state
   */
  renderScreen(gameState) {
    Object.values(this.screens).forEach(screen => screen?.classList.remove('active'));

    switch (gameState) {
      case GAME_CONFIG.STATES.WELCOME:
        this.screens.welcome?.classList.add('active');
        break;
      case GAME_CONFIG.STATES.TEAM_SELECTION:
        this.screens.teamSelection?.classList.add('active');
        break;
      case GAME_CONFIG.STATES.GET_READY:
        this.screens.getReady?.classList.add('active');
        break;
      case GAME_CONFIG.STATES.PLAYING:
        this.screens.game?.classList.add('active');
        break;
      case GAME_CONFIG.STATES.REVIEW:
        this.screens.review?.classList.add('active');
        break;
      case GAME_CONFIG.STATES.ROUND_OVER:
        this.screens.roundOver?.classList.add('active');
        break;
      case GAME_CONFIG.STATES.GAME_OVER:
        this.screens.gameOver?.classList.add('active');
        break;
    }
  }

  /**
   * Update the game card with a new word
   * @param {Object} card - Card object with targetWord and forbiddenWords
   */
  updateCard(card) {
    if (!card || !this.displays.targetWord || !this.displays.forbiddenWordsList) {
      return;
    }

    // Clear existing content
    this.displays.targetWord.innerHTML = '';
    this.displays.forbiddenWordsList.innerHTML = '';

    // Set target word
    this.displays.targetWord.textContent = card.targetWord;

    // Set forbidden words
    card.forbiddenWords.forEach(word => {
      const li = document.createElement('li');
      li.className = 'forbidden-word';
      li.textContent = word;
      this.displays.forbiddenWordsList.appendChild(li);
    });

    // Apply Splitting.js for character animation
    if (typeof Splitting !== 'undefined') {
      Splitting({ target: this.displays.targetWord, by: 'chars' });
    }

    // Animate card entrance
    animateElement(this.displays.gameCard, 'fadeInUp', 400);
  }

  /**
   * Update the score display
   * @param {number} score - Current round score
   */
  updateScore(score) {
    if (this.displays.score) {
      this.displays.score.textContent = score;
      animateElement(this.displays.score, 'tada', 800);
    }
  }

  /**
   * Update the timer display
   * @param {number} timeLeft - Seconds remaining
   */
  updateTimer(timeLeft) {
    if (this.displays.timer) {
      this.displays.timer.textContent = timeLeft;
      this.displays.timer.classList.toggle('low-time', timeLeft <= 10);
    }
  }

  /**
   * Update the current team indicator
   * @param {string} teamName - Team name
   * @param {string} teamColor - Team color
   */
  updateTeamIndicator(teamName, teamColor) {
    if (this.displays.currentTeamIndicator) {
      this.displays.currentTeamIndicator.textContent = `${teamName}'s Turn`;
      this.displays.currentTeamIndicator.style.backgroundColor = teamColor;
    }
  }

  /**
   * Update the scoreboard
   * @param {Array} teams - Array of team objects
   */
  updateScoreboard(teams) {
    if (!this.displays.scoreboard) return;

    this.displays.scoreboard.innerHTML = '';
    const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

    // Update winner display with leading team
    const leadingTeam = sortedTeams[0];
    if (this.displays.winnerTeamName && this.displays.winnerTeamScore && this.displays.winnerDisplay) {
      this.displays.winnerTeamName.textContent = leadingTeam.name;
      this.displays.winnerTeamScore.textContent = `${leadingTeam.score} points`;
      this.displays.winnerDisplay.style.background = 
        `linear-gradient(135deg, ${leadingTeam.color}, var(--yellow-300))`;
    }

    // Render scoreboard items
    sortedTeams.forEach(team => {
      const item = document.createElement('div');
      item.className = 'scoreboard-item';
      item.style.backgroundColor = team.color;
      item.innerHTML = `
        <span class="team-name">${team.name}</span>
        <span class="team-score">${team.score}</span>
      `;
      this.displays.scoreboard.appendChild(item);
    });
  }

  /**
   * Update the final scoreboard for game over screen
   * @param {Array} teams - Array of team objects
   */
  updateFinalScoreboard(teams) {
    if (!this.displays.finalScoreboard) return;

    this.displays.finalScoreboard.innerHTML = '';
    const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

    // Update champion display
    const champion = sortedTeams[0];
    if (this.displays.finalWinnerTeamName && this.displays.finalWinnerTeamScore) {
      this.displays.finalWinnerTeamName.textContent = champion.name;
      this.displays.finalWinnerTeamScore.textContent = `${champion.score} Total Points`;
    }

    // Render final scoreboard with medals
    sortedTeams.forEach((team, index) => {
      const item = document.createElement('div');
      item.className = 'scoreboard-item';
      item.style.backgroundColor = team.color;
      
      const position = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      item.innerHTML = `
        <span class="team-name">${position} ${team.name}</span>
        <span class="team-score">${team.score}</span>
      `;
      this.displays.finalScoreboard.appendChild(item);
    });
  }

  /**
   * Update countdown display
   * @param {number} countdownTime - Countdown time
   * @param {string} teamName - Current team name
   */
  updateCountdown(countdownTime, teamName) {
    if (this.displays.countdownNumber) {
      this.displays.countdownNumber.textContent = countdownTime;
    }
    if (this.displays.countdownMessage && teamName) {
      this.displays.countdownMessage.textContent = `${teamName}, Get Ready!`;
    }
  }

  /**
   * Show review screen with round cards
   * @param {Array} roundCards - Array of card results
   * @param {Function} toggleCallback - Callback for toggling card status
   */
  showReviewScreen(roundCards, toggleCallback) {
    const list = getElement('review-list');
    if (!list) return;

    list.innerHTML = '';
    roundCards.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'review-item';
      li.innerHTML = `
        <span class="review-word">${item.word}</span>
        <button class="status-btn ${item.status === 'correct' ? 'correct' : 'pass'}" 
                onclick="window.toggleCardStatus(${index})">
          ${item.status === 'correct' ? 'Correct' : 'Pass'}
        </button>
      `;
      list.appendChild(li);
    });

    this.updateReviewScore(roundCards);
  }

  /**
   * Update review score display
   * @param {Array} roundCards - Array of card results
   */
  updateReviewScore(roundCards) {
    const reviewScore = getElement('review-score');
    if (reviewScore) {
      const score = roundCards.filter(c => c.status === 'correct').length;
      reviewScore.textContent = score;
    }
  }
}
