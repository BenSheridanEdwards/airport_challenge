import { isStormy } from './Weather';

describe('Weather Component', () => {
  it('returns true when the forecast is stormy', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.0); // Mock Math.random to return 0.0
    expect(isStormy()).toBe(true);
    jest.spyOn(Math, 'random').mockRestore(); // Restore Math.random
  });

  it('returns false when the forecast is sunny', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5
    expect(isStormy()).toBe(false);
    jest.spyOn(Math, 'random').mockRestore(); // Restore Math.random
  });

  it('returns both true and false over multiple calls', () => {
    const results = [];
    for (let i = 0; i < 100; i++) {
      results.push(isStormy());
    }
    expect(results).toContain(true);
    expect(results).toContain(false);
  });
});
