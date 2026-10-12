/**
 * CRM Local Storage Utility
 * Persists data across page refreshes using localStorage.
 * Since this is a frontend-only app (no backend), localStorage
 * is the permanent store. Data survives refreshes within the same browser.
 */

const PREFIX = 'crm_client_';

/**
 * Load data from localStorage. Falls back to the provided default if nothing stored yet.
 * @param {string} key - Storage key (e.g. 'leads', 'deals')
 * @param {Array}  fallback - Default data array from data.js
 * @returns {Array}
 */
export function getStored(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[CRM Storage] Failed to read "${key}" from localStorage`, e);
  }
  return [...fallback]; // Return a copy so mutations don't affect the original
}

/**
 * Save data to localStorage.
 * @param {string} key  - Storage key
 * @param {Array}  data - Array to persist
 */
export function setStored(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[CRM Storage] Failed to save "${key}" to localStorage`, e);
  }
}

/**
 * Remove a specific key from storage (useful for reset/testing).
 * @param {string} key
 */
export function clearStored(key) {
  localStorage.removeItem(PREFIX + key);
}

/**
 * Reset ALL CRM stored data (restores data.js defaults on next load).
 */
export function resetAllStorage() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}
