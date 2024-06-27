// Plane.tsx

class Plane {
  airborn: boolean;

  constructor(airborn: boolean = false) {
    this.airborn = airborn;
  }

  inTheAir() {
    this.airborn = true;
  }

  landed() {
    this.airborn = false;
  }
}

export default Plane;
