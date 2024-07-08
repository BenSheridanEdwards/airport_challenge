import React, { useState } from 'react';
import Plane from '../Plane/Plane';
import { isStormy } from '../Weather/Weather';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type PlaneInstance = InstanceType<typeof Plane>;

const DEFAULT_CAPACITY = 5;

interface AirportProps {
  PlaneClass?: typeof Plane;
  generateUniqueId?: () => string;
}

const defaultGenerateUniqueId = (): string => {
  const id = '_' + Math.random().toString(36).substr(2, 9);
  return id;
};

const Airport: React.FC<AirportProps> = ({ PlaneClass = Plane, generateUniqueId = defaultGenerateUniqueId }) => {
  const [hanger, setHanger] = useState<PlaneInstance[]>([]);
  const [planeId, setPlaneId] = useState<string>('');

  const land = (plane: PlaneInstance): void => {
    try {
      if (hangerFull()) {
        throw new Error('Hanger full, abort landing!');
      }
      if (landed(plane)) {
        throw new Error('That plane is already here');
      }
      if (isStormy()) {
        throw new Error('Stormy weather, cannot land the plane!');
      }
      plane.landed();
      setHanger(prevHanger => [...prevHanger, plane]);
      toast.success('Plane landed successfully.');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const takeOff = (plane: PlaneInstance): void => {
    try {
      if (!landed(plane)) {
        throw new Error("No planes available for takeoff");
      }
      if (isStormy()) {
        throw new Error('Stormy weather, unable to take off!');
      }
      plane.inTheAir();
      setHanger(prevHanger => prevHanger.filter(p => p.id !== plane.id));
      toast.success('Plane took off successfully.');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const hangerFull = (): boolean => {
    return hanger.length >= DEFAULT_CAPACITY;
  };

  const landed = (plane: PlaneInstance): boolean => {
    return hanger.some(p => p.id === plane.id);
  };

  const handleLand = (planeId?: string) => {
    if (hangerFull()) {
      toast.error('Hanger full, abort landing!');
      return;
    }
    if (planeId) {
      const plane = createPlane(planeId);
      land(plane);
    } else {
      const newPlaneId = generateUniqueId();
      if (!newPlaneId) {
        toast.error('Error generating unique ID, aborting landing process');
        return;
      }
      const newPlane = createPlane(newPlaneId);
      land(newPlane);
    }
    setPlaneId(''); // Clear the input field after landing
  };

  const handleTakeOff = (planeId?: string) => {
    if (planeId) {
      const plane = hanger.find(p => p.id === planeId);
      if (plane) {
        takeOff(plane);
      } else {
        toast.error("No planes available for takeoff");
      }
    } else {
      if (hanger.length > 0) {
        const plane = hanger[0];
        takeOff(plane);
      } else {
        toast.error('No planes available for takeoff.');
      }
    }
  };

  const createPlane = (id: string): PlaneInstance => {
    if (!id) {
      throw new Error('Cannot create plane with undefined ID');
    }
    return new PlaneClass(id);
  };

  return (
    <div className="p-4" data-testid="hanger-container">
      <h2 className="text-2xl">Airport</h2>
      <p>Capacity: {DEFAULT_CAPACITY}</p>
      <p role="status" data-testid="hanger-count">Planes in hanger: {hanger.length}</p>
      <input
        type="text"
        value={planeId}
        onChange={(e) => setPlaneId(e.target.value)}
        placeholder="Enter plane ID"
        className="border p-2"
        data-testid="plane-id-input"
      />
      <button className="bg-teal-500 text-white p-2 m-2" onClick={() => handleLand(planeId)}>Land Plane</button>
      <button className="bg-red-500 text-white p-2 m-2" onClick={() => handleTakeOff()} data-testid="takeoff-container">Take Off Plane</button>
      <ToastContainer />
    </div>
  );
};

export default Airport;
