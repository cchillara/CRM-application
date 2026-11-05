/**
 * CRM Local Storage Utility
 */
const PREFIX = 'crm_client_';

export function getStored(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[CRM Storage] Failed to read "${key}" from localStorage`, e);
  }
  return [...fallback];
}

export function setStored(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[CRM Storage] Failed to save "${key}" to localStorage`, e);
  }
}

export function clearStored(key) {
  localStorage.removeItem(PREFIX + key);
}

export function resetAllStorage() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}
