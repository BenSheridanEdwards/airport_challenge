import Plane from './Plane/Plane';

describe('Plane', () => {
  it('should be in the air after calling inTheAir', () => {
    const plane = new Plane();
    plane.inTheAir();
    expect(plane.airborn).toBe(true);
  });

  it('should be landed after calling landed', () => {
    const plane = new Plane(true);
    plane.landed();
    expect(plane.airborn).toBe(false);
  });
});
