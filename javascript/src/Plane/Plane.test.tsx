import Plane from './Plane';

describe('Plane', () => {
  it('should be in the air after calling inTheAir', () => {
    const plane = new Plane('0');
    plane.inTheAir();
    expect(plane.airborne).toBe(true);
  });

  it('should be landed after calling landed', () => {
    const plane = new Plane('0', true);
    plane.landed();
    expect(plane.airborne).toBe(false);
  });
});
