class Plane {
  id: string;
  airborn: boolean;

  constructor(id: string, airborn: boolean = false) {
    this.id = id;
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
