// Utilitaire pour stocker/récupérer le nom d'utilisateur avec expiration (24h)

const USERNAME_KEY = 'lc_username';
const USERNAME_EXP_KEY = 'lc_username_exp';
const EXPIRATION_MS = 2 * 60 * 60 * 1000; // 2h

export function setGuestUsername(username) {
  localStorage.setItem(USERNAME_KEY, username);
  localStorage.setItem(USERNAME_EXP_KEY, Date.now().toString());
}

export function getGuestUsername() {
  const username = localStorage.getItem(USERNAME_KEY);
  const exp = localStorage.getItem(USERNAME_EXP_KEY);
  if (!username || !exp) return null;
  if (Date.now() - parseInt(exp, 10) > EXPIRATION_MS) {
    clearGuestUsername();
    return null;
  }
  return username;
}

export function clearGuestUsername() {
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(USERNAME_EXP_KEY);
}

export function needGuestUsernamePrompt() {
  return !getGuestUsername();
}
