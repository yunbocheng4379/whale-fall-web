import Cookies from "js-cookie";

import {TOKEN_KEY, USERNAME_KEY} from "@/config";

function getToken() {
  return Cookies.get(TOKEN_KEY)
}

function setToken(token) {
  return Cookies.set(TOKEN_KEY, token)
}

function removeToken() {
  return Cookies.remove(TOKEN_KEY)
}

function getUsername() {
  return Cookies.get(USERNAME_KEY)
}

function setUsername(username) {
  return Cookies.set(USERNAME_KEY, username)
}

function removeUsername() {
  return Cookies.remove(USERNAME_KEY)
}

export {TOKEN_KEY, getToken, setToken, removeToken, USERNAME_KEY, getUsername, setUsername, removeUsername}
