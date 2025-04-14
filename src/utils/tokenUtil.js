import Cookies from 'js-cookie';

import { TOKEN_KEY, USERNAME_KEY, USER_ROLE } from '@/config';

function getToken() {
  return Cookies.get(TOKEN_KEY);
}

function setToken(token) {
  return Cookies.set(TOKEN_KEY, token);
}

function removeToken() {
  return Cookies.remove(TOKEN_KEY);
}

function getUsername() {
  return Cookies.get(USERNAME_KEY);
}

function setUsername(username) {
  return Cookies.set(USERNAME_KEY, username);
}

function removeUsername() {
  return Cookies.remove(USERNAME_KEY);
}

function getUserRole() {
  return Cookies.get(USER_ROLE);
}

function setUserRole(role) {
  return Cookies.set(USER_ROLE, role);
}

function removeUserRole() {
  return Cookies.remove(USER_ROLE);
}

export {
  TOKEN_KEY,
  USERNAME_KEY,
  getToken,
  getUserRole,
  getUsername,
  removeToken,
  removeUserRole,
  removeUsername,
  setToken,
  setUserRole,
  setUsername,
};
