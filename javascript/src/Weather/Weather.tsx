const FORECASTS: string[] = ['stormy', 'sunny', 'sunny', 'sunny'];

export const isStormy = (): boolean => {
  const forecast = FORECASTS[Math.floor(Math.random() * FORECASTS.length)];
  return forecast === 'stormy';
};