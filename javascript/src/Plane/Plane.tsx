class Plane {
  id: string;
  airborne: boolean;

  constructor(id: string, airborne: boolean = false) {
    this.id = id;
    this.airborne = airborne;
  }

  inTheAir() {
    this.airborne = true;
  }

  landed() {
    this.airborne = false;
  }
}

export default Plane;
