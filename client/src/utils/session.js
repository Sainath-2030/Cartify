// A lightweight per-browser-tab session id, used to group anonymous
// interaction events (e.g. for future GRU-style session sequence
// modeling) without identifying the person. Persists for the tab's
// lifetime via sessionStorage; a new tab gets a new id.
const SESSION_KEY = 'cartify_session_id';

export function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
