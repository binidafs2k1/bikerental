import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:4000" });

// If a token exists in localStorage (page refresh / direct navigation), initialize
// the default Authorization header immediately so components that run fetches
// on first render will include the token.
try {
  const saved = localStorage.getItem("token");
  if (saved) {
    API.defaults.headers.common["Authorization"] = `Bearer ${saved}`;
  }
} catch (e) {
  // localStorage may be unavailable in some environments; ignore in that case
}

export function setToken(token) {
  if (token) API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete API.defaults.headers.common["Authorization"];
}

export default API;
