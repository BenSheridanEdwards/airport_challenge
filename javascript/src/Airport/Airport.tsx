import React, { useState, useEffect } from 'react';
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
  const [hangar, setHangar] = useState<PlaneInstance[]>([]);
  const [planeId, setPlaneId] = useState<string>('');
  const [pendingOperations, setPendingOperations] = useState<number>(0);

  const land = async (plane: PlaneInstance): Promise<void> => {
    if (hangarFull()) {
      throw new Error('Hangar full, abort landing!');
    } else if (landed(plane)) {
      throw new Error('That plane is already here');
    } else if (isStormy()) {
      throw new Error('Stormy weather, cannot land the plane!');
    } else {
      plane.landed();
      setPendingOperations(prev => prev + 1);
      setHangar(prevHangar => {
        const updatedHangar = [...prevHangar, plane];
        return updatedHangar;
      });
    }
  };

  const takeOff = async (plane: PlaneInstance): Promise<void> => {
    if (!landed(plane)) {
      throw new Error("No planes available for takeoff");
    } else if (isStormy()) {
      throw new Error('Stormy weather, unable to take off!');
    } else {
      plane.inTheAir();
      setPendingOperations(prev => prev + 1);
      setHangar(prevHangar => {
        const updatedHangar = prevHangar.filter(p => p.id !== plane.id);
        return updatedHangar;
      });
    }
  };

  const hangarFull = (): boolean => {
    return hangar.length >= DEFAULT_CAPACITY;
  };

  const landed = (plane: PlaneInstance): boolean => {
    return hangar.some(p => p.id === plane.id);
  };

  const handleLand = async (planeId?: string) => {
    if (hangarFull()) {
      toast.error('Hangar full, abort landing!');
      return;
    }
    try {
      const id = planeId || generateUniqueId();
      if (!id) {
        toast.error('Error generating unique ID, aborting landing process');
        return;
      }
      const plane = createPlane(id);
      await land(plane);
      setPlaneId(''); // Clear the input field after landing
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleTakeOff = async (planeId?: string) => {
    try {
      const plane = planeId ? hangar.find(p => p.id === planeId) : hangar[0];
      if (plane) {
        await takeOff(plane);
      } else {
        toast.error('No planes available for takeoff.');
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

  useEffect(() => {
    if (pendingOperations > 0) {
      setPendingOperations(prev => prev - 1);
    } else if (pendingOperations === 0) {
      // Perform actions that depend on state updates being complete
      // For example, enable UI interactions or trigger final state updates
    }
  }, [hangar, pendingOperations]);

  return (
    <div className="p-4" data-testid="hangar-container">
      <h2 className="text-2xl">Airport</h2>
      <p>Capacity: {DEFAULT_CAPACITY}</p>
      <p role="status" data-testid="hangar-count">Planes in hangar: {hangar.length}</p>
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
      <ToastContainer data-testid="toast-container" />
    </div>
  );
};

export default Airport;
