import { isStormy } from './Weather/Weather';

describe('Weather', () => {
  it('should return true if the weather is stormy', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0
    expect(isStormy()).toBe(true);
  });

  it('should return false if the weather is sunny', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5
    expect(isStormy()).toBe(false);
  });
});
