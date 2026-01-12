
// --- DATA ---
let ROUND_DURATION = 30; // Changed to let, default 30s
const COUNTDOWN_DURATION = 10;
// gameCards is loaded from cards.js

// --- STATE ---
let gameState = 'WELCOME';
let roundScore = 0;
let timeLeft = ROUND_DURATION;
let countdownTime = COUNTDOWN_DURATION;
let timerInterval = null;
let countdownInterval = null;
let shuffledCards = [];
let currentCardIndex = 0;
let numberOfTeams = 0;
let teams = [];
const teamColors = ['var(--team1-color)', 'var(--team2-color)', 'var(--team3-color)', 'var(--team4-color)'];
let currentTeamIndex = 0;
let totalRoundsCompleted = 0;
const MAX_ROUNDS_PER_TEAM = 3;
let selectedDecks = new Set(['naija']);
let roundCards = [];

// --- DOM ELEMENTS ---
const screens = { welcome: document.getElementById('welcome-screen'), teamSelection: document.getElementById('team-selection-screen'), game: document.getElementById('game-screen'), roundOver: document.getElementById('round-over-screen'), gameOver: document.getElementById('game-over-screen'), getReady: document.getElementById('get-ready-screen'), review: document.getElementById('review-screen') };
const buttons = { playNow: document.getElementById('play-now-btn'), pass: document.getElementById('pass-btn'), correct: document.getElementById('correct-btn'), nextRound: document.getElementById('next-round-btn'), newGame: document.getElementById('new-game-btn'), teamCount: document.querySelectorAll('.team-count-btn'), playAgain: document.getElementById('play-again-btn'), skipCountdown: document.getElementById('skip-countdown-btn'), sound: document.getElementById('sound-btn'), deckOptions: document.querySelectorAll('.deck-option') };
const displays = { score: document.getElementById('score'), timer: document.getElementById('timer'), targetWord: document.getElementById('target-word'), forbiddenWordsList: document.getElementById('forbidden-words-list'), gameCard: document.getElementById('game-card'), currentTeamIndicator: document.getElementById('current-team-indicator'), scoreboard: document.getElementById('scoreboard'), winnerTeamName: document.getElementById('winner-team-name'), winnerTeamScore: document.getElementById('winner-team-score'), winnerDisplay: document.getElementById('winner-display'), finalWinnerTeamName: document.getElementById('final-winner-team-name'), finalWinnerTeamScore: document.getElementById('final-winner-team-score'), finalScoreboard: document.getElementById('final-scoreboard'), countdownNumber: document.getElementById('countdown-number'), countdownMessage: document.getElementById('countdown-message'), };

// --- AUDIO MANAGER ---
const SoundManager = {
  ctx: null,
  enabled: true,
  sounds: {
      correct: new Audio('correct.mp3'),
      timeup: new Audio('timeup.mp3')
  },
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
  },
  toggle() {
    this.enabled = !this.enabled;
    buttons.sound.textContent = this.enabled ? '🔊' : '🔇';
    if (this.enabled) this.init();
  },
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
    } catch(e) { console.error("Audio Error:", e); }
  },
  playSound(name) {
      if (!this.enabled) return;
      const sound = this.sounds[name];
      if (sound) {
          sound.currentTime = 0;
          sound.play().catch(e => {
              console.log("Audio play failed, falling back to beep:", e);
              // Fallback logic
              if (name === 'correct') this.playTone(600, 0.1, 'sine');
              if (name === 'timeup') this.playTone(80, 1.0, 'sawtooth');
          });
      }
  },
  countdownBeep() { this.playTone(600, 0.1, 'sine'); },
  goBeep() { this.playTone(800, 0.3, 'square'); },
  playCorrect() { this.playSound('correct'); },
  playTimeUp() { this.playSound('timeup'); }
};

// --- ANIMATION HELPER ---
const animateElement = (element, animation, duration) => {
  if (!element) return;
  element.classList.add('animated', animation);
  if (duration) {
      element.style.animationDuration = `${duration}ms`;
  }

  function handleAnimationEnd(event) {
    if (event.target !== element) return;
    element.classList.remove('animated', animation);
    element.style.removeProperty('animation-duration');
    element.removeEventListener('animationend', handleAnimationEnd);
  }
  element.addEventListener('animationend', handleAnimationEnd);
};

// --- GAME LOGIC ---
const shuffleArray = (array) => { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; };

const renderScreen = () => { Object.values(screens).forEach(screen => screen.classList.remove('active')); if (gameState === 'WELCOME') screens.welcome.classList.add('active'); if (gameState === 'TEAM_SELECTION') screens.teamSelection.classList.add('active'); if (gameState === 'GET_READY') screens.getReady.classList.add('active'); if (gameState === 'PLAYING') screens.game.classList.add('active'); if (gameState === 'REVIEW') screens.review.classList.add('active'); if (gameState === 'ROUND_OVER') screens.roundOver.classList.add('active'); if (gameState === 'GAME_OVER') screens.gameOver.classList.add('active'); };

const updateCard = () => {
  const card = shuffledCards[currentCardIndex];
  if (!card) { endRound(); return; }
  
  displays.targetWord.innerHTML = '';
  displays.forbiddenWordsList.innerHTML = '';
  
  displays.targetWord.textContent = card.targetWord;
  card.forbiddenWords.forEach(word => { const li = document.createElement('li'); li.className = 'forbidden-word'; li.textContent = word; displays.forbiddenWordsList.appendChild(li); });
  
  Splitting({ target: displays.targetWord, by: 'chars' });
  Splitting({ target: displays.targetWord, by: 'chars' });
  animateElement(displays.gameCard, 'fadeInUp', 400);
};

const showReviewScreen = () => {
     gameState = 'REVIEW';
     renderScreen();
     const list = document.getElementById('review-list');
     list.innerHTML = '';
     roundCards.forEach((item, index) => {
         const li = document.createElement('li');
         li.className = 'review-item';
         li.innerHTML = `
           <span class="review-word">${item.word}</span>
           <button class="status-btn ${item.status === 'correct' ? 'correct' : 'pass'}" onclick="toggleCardStatus(${index})">
             ${item.status === 'correct' ? 'Correct' : 'Pass'}
           </button>
         `;
         list.appendChild(li);
     });
     updateReviewScore();
};

window.toggleCardStatus = (index) => {
     const item = roundCards[index];
     item.status = item.status === 'correct' ? 'skipped' : 'correct';
     showReviewScreen(); // Re-render to update UI
};

const updateReviewScore = () => {
     roundScore = roundCards.filter(c => c.status === 'correct').length;
     document.getElementById('review-score').textContent = roundScore;
};

const nextCard = () => { currentCardIndex++; if (currentCardIndex >= shuffledCards.length) { shuffledCards = shuffleArray([...gameCards]); currentCardIndex = 0; } updateCard(); };



const updateTimer = () => { 
   if (isPaused) return; // double check
   timeLeft--; 
   displays.timer.textContent = timeLeft; 
   displays.timer.classList.toggle('low-time', timeLeft <= 10); 
   if (timeLeft <= 0) { 
      SoundManager.playTimeUp();
      showReviewScreen(); 
   } else if (timeLeft <= 5) {
      // Optional critical ticking sound for last 5 seconds?
      // SoundManager.countdownBeep(); 
   }
 };

// --- PAUSE LOGIC ---
let isPaused = false;
const pauseOverlay = document.getElementById('pause-overlay');

const togglePause = () => {
    if (gameState !== 'PLAYING') return;
    
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(timerInterval);
        pauseOverlay.style.display = 'flex';
    } else {
        pauseOverlay.style.display = 'none';
        timerInterval = setInterval(updateTimer, 1000);
    }
};

const updateScoreboard = () => {
  displays.scoreboard.innerHTML = '';
  teams.sort((a, b) => b.score - a.score); 
  
  // Update winner display with leading team
  const leadingTeam = teams[0];
  displays.winnerTeamName.textContent = leadingTeam.name;
  displays.winnerTeamScore.textContent = `${leadingTeam.score} points`;
  displays.winnerDisplay.style.background = `linear-gradient(135deg, ${leadingTeam.color}, var(--yellow-300))`;
  
  teams.forEach(team => {
    const item = document.createElement('div');
    item.className = 'scoreboard-item';
    item.style.backgroundColor = team.color;
    item.innerHTML = `<span class="team-name">${team.name}</span><span class="team-score">${team.score}</span>`;
    displays.scoreboard.appendChild(item);
  });
};

const startCountdown = () => {
  gameState = 'GET_READY';
  countdownTime = COUNTDOWN_DURATION;
  const currentTeam = teams[currentTeamIndex];
  displays.countdownMessage.textContent = `${currentTeam.name}, Get Ready!`;
  displays.countdownNumber.textContent = countdownTime;
  renderScreen();
  
  clearInterval(countdownInterval);
  SoundManager.countdownBeep(); // Beep for the initial number
  countdownInterval = setInterval(() => {
    countdownTime--;
    displays.countdownNumber.textContent = countdownTime;
    if (countdownTime > 0) {
         SoundManager.countdownBeep();
    }
    if (countdownTime <= 0) {
      clearInterval(countdownInterval);
      SoundManager.goBeep();
      startRound();
    }
  }, 1000);
};

const skipCountdown = () => {
  clearInterval(countdownInterval);
  startRound();
};

const startRound = () => {
  gameState = 'PLAYING';
  isPaused = false; 
  pauseOverlay.style.display = 'none';
  roundCards = [];
  roundScore = 0;
  timeLeft = ROUND_DURATION;
  displays.score.textContent = roundScore;
  displays.timer.textContent = timeLeft;
  displays.timer.classList.remove('low-time');
  const currentTeam = teams[currentTeamIndex];
  displays.currentTeamIndicator.textContent = `${currentTeam.name}'s Turn`;
  displays.currentTeamIndicator.style.backgroundColor = currentTeam.color;
  renderScreen();
  updateCard();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
};

const setupAndStartGame = (teamCount) => {
  numberOfTeams = teamCount;
  teams = [];
  for (let i = 0; i < numberOfTeams; i++) {
    teams.push({ name: `Team ${i + 1}`, score: 0, color: teamColors[i] });
  }
  currentTeamIndex = 0;
  totalRoundsCompleted = 0;
  currentTeamIndex = 0;
  totalRoundsCompleted = 0;
  
  // Filter cards based on selected decks
  const activeCards = gameCards.filter(card => {
     const category = card.category || 'naija'; // Default to 'naija' for existing cards
     return selectedDecks.has(category);
  });
  
  if (activeCards.length === 0) {
      alert("Please select at least one deck!");
      return;
  }

  shuffledCards = shuffleArray([...activeCards]);
  currentCardIndex = 0;
  startCountdown();
};

const endRound = () => {
  clearInterval(timerInterval);
  teams[currentTeamIndex].score += roundScore;
  currentTeamIndex = (currentTeamIndex + 1) % numberOfTeams;
  totalRoundsCompleted++;
  
  // Check if all teams have completed 3 rounds
  if (totalRoundsCompleted >= numberOfTeams * MAX_ROUNDS_PER_TEAM) {
    showFinalWinner();
    return;
  }
  
  gameState = 'ROUND_OVER';
  updateScoreboard();
  const nextTeamName = teams[currentTeamIndex].name;
  const roundsLeft = MAX_ROUNDS_PER_TEAM - Math.floor(totalRoundsCompleted / numberOfTeams);
  buttons.nextRound.textContent = `Start ${nextTeamName}'s Turn (Round ${Math.floor(totalRoundsCompleted / numberOfTeams) + 1}/${MAX_ROUNDS_PER_TEAM})`;
  renderScreen();
  animateElement(document.querySelector('#round-over-screen > .title-screen'), 'fadeIn', 800);
};

const showFinalWinner = () => {
  gameState = 'GAME_OVER';
  teams.sort((a, b) => b.score - a.score);
  const champion = teams[0];
  
  // Update final winner display
  displays.finalWinnerTeamName.textContent = champion.name;
  displays.finalWinnerTeamScore.textContent = `${champion.score} Total Points`;
  
  // Update final scoreboard
  displays.finalScoreboard.innerHTML = '';
  teams.forEach((team, index) => {
    const item = document.createElement('div');
    item.className = 'scoreboard-item';
    item.style.backgroundColor = team.color;
    const position = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    item.innerHTML = `<span class="team-name">${position} ${team.name}</span><span class="team-score">${team.score}</span>`;
    displays.finalScoreboard.appendChild(item);
  });
  
  renderScreen();
  animateElement(document.querySelector('#game-over-screen > .title-screen'), 'fadeIn', 800);
};

const resetGame = () => {
  clearInterval(timerInterval);
  clearInterval(countdownInterval);
  gameState = 'TEAM_SELECTION';
  totalRoundsCompleted = 0;
  renderScreen();
};

const showTeamSelection = () => {
     SoundManager.init(); // Initialize audio context on user gesture
     gameState = 'TEAM_SELECTION';
     renderScreen();
     animateElement(document.querySelector('#team-selection-screen > .title-screen'), 'fadeIn', 800);
};

const toggleDeck = (element) => {
    const deck = element.dataset.deck;
    if (selectedDecks.has(deck)) return;

    selectedDecks.clear();
    buttons.deckOptions.forEach(btn => btn.classList.remove('selected'));
    
    selectedDecks.add(deck);
    element.classList.add('selected');
};

const handleCorrect = () => { 
    roundCards.push({ word: displays.targetWord.textContent, status: 'correct' });
    roundScore++; displays.score.textContent = roundScore; animateElement(displays.score, 'tada', 800); 
    SoundManager.playCorrect();
    nextCard(); 
};
const handlePass = () => { 
    roundCards.push({ word: displays.targetWord.textContent, status: 'skipped' });
    nextCard(); 
};

// --- EVENT LISTENERS ---
const actions = {
  'play-now-btn': showTeamSelection, 'next-round-btn': startCountdown,
  'new-game-btn': resetGame, 'play-again-btn': resetGame,
  'skip-countdown-btn': skipCountdown, 'correct-btn': handleCorrect,
  'pass-btn': handlePass, 'sound-btn': () => SoundManager.toggle(),
  'confirm-score-btn': endRound,
  'pause-btn': togglePause, 'resume-btn': togglePause
};
Object.entries(actions).forEach(([id, fn]) => document.getElementById(id)?.addEventListener('click', fn));

buttons.teamCount.forEach(b => b.addEventListener('click', (e) => setupAndStartGame(parseInt(e.target.dataset.teams))));
buttons.deckOptions.forEach(o => o.addEventListener('click', (e) => toggleDeck(e.currentTarget)));

// Timer Selection Logic
document.querySelectorAll('.timer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        ROUND_DURATION = parseInt(e.target.dataset.time);
    });
});

// --- INITIAL RENDER ---
renderScreen();
animateElement(document.querySelector('#welcome-screen > .title-screen'), 'fadeIn', 800);
