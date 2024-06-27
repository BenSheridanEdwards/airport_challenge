// Plane.js

class Plane {
  constructor(airborn = false) {
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
