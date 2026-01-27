/**
 * Utility Functions
 */

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Animates an element with a given animation class
 * @param {HTMLElement} element - Element to animate
 * @param {string} animation - Animation class name
 * @param {number} duration - Animation duration in milliseconds
 */
export const animateElement = (element, animation, duration) => {
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

/**
 * Loads game cards from JSON file
 * @returns {Promise<Object>} - Card data object with naija and global arrays
 */
export const loadCards = async () => {
  try {
    const response = await fetch('./data/cards.json');
    if (!response.ok) {
      throw new Error('Failed to load cards');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading cards:', error);
    // Return empty card sets if loading fails
    return { naija: [], global: [] };
  }
};

/**
 * Gets a DOM element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} - DOM element or null
 */
export const getElement = (id) => {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with id "${id}" not found`);
  }
  return element;
};

/**
 * Gets all DOM elements matching a selector
 * @param {string} selector - CSS selector
 * @returns {NodeList} - NodeList of elements
 */
export const getElements = (selector) => {
  return document.querySelectorAll(selector);
};
