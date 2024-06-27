// Weather.js

const FORECASTS = ['stormy', 'sunny', 'sunny', 'sunny'];

export const isStormy = () => {
  const forecast = FORECASTS[Math.floor(Math.random() * FORECASTS.length)];
  return forecast === 'stormy';
};
