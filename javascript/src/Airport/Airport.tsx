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

  const land = (plane: PlaneInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (hangerFull()) {
        reject(new Error('Hanger full, abort landing!'));
      } else if (landed(plane)) {
        reject(new Error('That plane is already here'));
      } else if (isStormy()) {
        reject(new Error('Stormy weather, cannot land the plane!'));
      } else {
        plane.landed();
        setHanger(prevHanger => {
          const updatedHanger = [...prevHanger, plane];
          resolve();
          return updatedHanger;
        });
      }
    });
  };

  const takeOff = (plane: PlaneInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!landed(plane)) {
        reject(new Error("No planes available for takeoff"));
      } else if (isStormy()) {
        reject(new Error('Stormy weather, unable to take off!'));
      } else {
        plane.inTheAir();
        setHanger(prevHanger => {
          const updatedHanger = prevHanger.filter(p => p.id !== plane.id);
          resolve();
          return updatedHanger;
        });
      }
    });
  };

  const hangerFull = (): boolean => {
    return hanger.length >= DEFAULT_CAPACITY;
  };

  const landed = (plane: PlaneInstance): boolean => {
    return hanger.some(p => p.id === plane.id);
  };

  const handleLand = async (planeId?: string) => {
    if (hangerFull()) {
      toast.error('Hanger full, abort landing!');
      return;
    }
    try {
      if (planeId) {
        const plane = createPlane(planeId);
        await land(plane);
      } else {
        const newPlaneId = generateUniqueId();
        if (!newPlaneId) {
          toast.error('Error generating unique ID, aborting landing process');
          return;
        }
        const newPlane = createPlane(newPlaneId);
        await land(newPlane);
      }
      setPlaneId(''); // Clear the input field after landing
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleTakeOff = async (planeId?: string) => {
    try {
      if (planeId) {
        const plane = hanger.find(p => p.id === planeId);
        if (plane) {
          await takeOff(plane);
        } else {
          toast.error("No planes available for takeoff");
        }
      } else {
        if (hanger.length > 0) {
          const plane = hanger[0];
          await takeOff(plane);
        } else {
          toast.error('No planes available for takeoff.');
        }
      }
    } catch (error) {
      toast.error((error as Error).message);
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
      <button
        className="bg-teal-500 text-white p-2 m-2"
        onClick={() => handleLand(planeId).catch(error => toast.error(error.message))}
      >
        Land Plane
      </button>
      <button
        className="bg-red-500 text-white p-2 m-2"
        onClick={() => handleTakeOff().catch(error => toast.error(error.message))}
        data-testid="takeoff-container"
      >
        Take Off Plane
      </button>
      <ToastContainer />
    </div>
  );
};

export default Airport;
