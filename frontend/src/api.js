// src/api.js - All API calls go through the backend
import axios from 'axios';

// Use environment variable for deployed URL, fallback to proxy for local dev
const BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Fetch birth chart + AI interpretation
export const getBirthChart = (data) => api.post('/birth-chart', data);

// Fetch Kundali matching
export const getMatchResult = (data) => api.post('/match', data);

// Fetch horoscope
export const getHoroscope = (data) => api.post('/horoscope', data);
