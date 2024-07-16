import React, { useState, useEffect, useCallback } from 'react';
import Plane from '../Plane/Plane';
import { isStormy } from '../Weather/Weather';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type PlaneInstance = InstanceType<typeof Plane>;

interface AirportProps {
  PlaneClass?: typeof Plane;
  generateUniqueId?: () => string;
}

const defaultGenerateUniqueId = (): string => {
  const id = '_' + Math.random().toString(36).substr(2, 9);
  return id;
};

const Airport: React.FC<AirportProps> = ({ PlaneClass = Plane, generateUniqueId = defaultGenerateUniqueId }): JSX.Element => {
  const [hanger, setHanger] = useState<PlaneInstance[]>([]);
  const [planeId, setPlaneId] = useState<string>('');
  const [capacity, setCapacity] = useState(5);
  const [newCapacity, setNewCapacity] = useState<string>('');
  const [selectedPlane, setSelectedPlane] = useState<string>('');
  const [hangarCount, setHangarCount] = useState(0);

  useEffect(() => {
    console.log('useEffect for hangarCount triggered');
    console.log('Before setHangarCount - hanger:', hanger, 'hangarCount:', hangarCount);
    setHangarCount(hanger.length);
    console.log('After setHangarCount - hanger:', hanger, 'new hangarCount:', hanger.length);
  }, [hanger]);

  const checkWeather = () => {
    const stormy = isStormy();
    console.log(`Is it stormy?`, stormy);
    return stormy;
  };

  const createPlane = useCallback((id: string): PlaneInstance => {
    if (!id) {
      throw new Error('Cannot create plane with undefined ID');
    }
    return new PlaneClass(id);
  }, [PlaneClass]);

  const isValidPlaneId = useCallback((id: string): boolean => {
    // Check if the ID is non-empty, alphanumeric, and between 3 and 10 characters
    return /^[a-zA-Z0-9]{3,10}$/.test(id);
  }, []);

  const hangerFull = useCallback((): boolean => {
    return hanger.length >= capacity;
  }, [hanger, capacity]);

  const landed = useCallback((plane: PlaneInstance): boolean => {
    return hanger.some(p => p.id === plane.id);
  }, [hanger]);

  const land = useCallback((plane: PlaneInstance): void => {
    console.log(`land function called for plane ${plane.id}`);
    console.log(`Before setHanger - hanger:`, hanger, `hangarCount:`, hangarCount);

    if (hangerFull()) {
      console.log('Hanger full, aborting landing');
      throw new Error('Hanger full, abort landing!');
    }
    if (landed(plane)) {
      console.log('Plane already landed, aborting landing');
      throw new Error('That plane is already here');
    }
    if (checkWeather()) {
      console.log('Stormy weather, aborting landing');
      throw new Error('Stormy weather, cannot land the plane!');
    }

    console.log(`Landing plane ${plane.id}`);
    plane.landed();
    setHanger(prevHanger => {
      const newHanger = [...prevHanger, plane];
      console.log('Inside setHanger callback - newHanger:', newHanger);
      return newHanger;
    });

    console.log(`After setHanger call - hanger:`, hanger, `hangarCount:`, hangarCount);
  }, [hanger, hangarCount, hangerFull, landed, checkWeather]);

  const takeOff = useCallback((plane: PlaneInstance): void => {
    console.log(`Attempting takeoff for plane ${plane.id}`);
    if (!landed(plane)) {
      console.log(`Plane ${plane.id} not in hanger, cannot take off`);
      throw new Error("No planes available for takeoff");
    }
    if (checkWeather()) {
      console.log(`Stormy weather, plane ${plane.id} unable to take off`);
      throw new Error('Stormy weather, unable to take off!');
    }
    plane.inTheAir();
    setHanger(prevHanger => {
      const newHanger = prevHanger.filter(p => p.id !== plane.id);
      console.log(`Updated hanger after takeoff:`, newHanger);
      return newHanger;
    });
    console.log(`Plane ${plane.id} has taken off successfully`);
  }, [landed, checkWeather]);

  const handleCapacityChange = () => {
    const capacityValue = parseInt(newCapacity, 10);
    if (!isNaN(capacityValue) && capacityValue > 0) {
      setCapacity(capacityValue);
      setNewCapacity('');
      toast.success(`Airport capacity updated to ${capacityValue}`);
    } else {
      toast.error('Please enter a valid positive number for capacity');
    }
  };



  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLand(planeId);
  };

  const handleLand = useCallback((planeId?: string) => {
    console.log(`handleLand called with planeId:`, planeId);
    console.log(`Before landing - hanger:`, hanger, `hangarCount:`, hangarCount);

    if (hangerFull()) {
      console.log('Hanger full, aborting landing');
      toast.error('Hanger full, abort landing!');
      return;
    }
    try {
      const id = planeId?.trim() || generateUniqueId();
      console.log(`Generated/Provided plane ID:`, id);

      if (!isValidPlaneId(id)) {
        console.log('Invalid plane ID, aborting landing');
        toast.error('Invalid plane ID, please enter a valid ID');
        return;
      }
      const plane = createPlane(id);
      console.log(`Created plane:`, plane);

      land(plane);
      console.log(`Immediately after land() call - hanger:`, hanger, `hangarCount:`, hangarCount);
      setPlaneId('');
      console.log(`Plane ${plane.id} has landed successfully`);
      setTimeout(() => {
        console.log(`Delayed after landing - hanger:`, hanger, `hangarCount:`, hangarCount);
      }, 100);
      toast.success(`Plane ${plane.id} has landed`);
    } catch (error: unknown) {
      console.error('Error during landing:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }, [hanger, hangarCount, hangerFull, land, createPlane, generateUniqueId, isValidPlaneId, setPlaneId]);



  const handleTakeOff = useCallback(() => {
    if (!selectedPlane) {
      toast.error('Please select a plane for takeoff');
      return;
    }
    try {
      const plane = hanger.find(p => p.id === selectedPlane);
      if (!plane) {
        toast.error('Selected plane not found in hanger');
        return;
      }
      if (checkWeather()) {
        toast.error('Stormy weather, unable to take off!');
        return;
      }
      takeOff(plane);
      setSelectedPlane('');
      toast.success(`Plane ${plane.id} has taken off`);
    } catch (error: unknown) {
      console.error('Error during takeoff:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }, [selectedPlane, hanger, checkWeather, takeOff, setSelectedPlane]);

  console.log('Rendering Airport component, planeId:', planeId, 'isValidPlaneId:', isValidPlaneId(planeId));

  return (
    <div className="p-4" data-testid="hanger-container">
      <h2 className="text-2xl" data-testid="airport-heading">Airport</h2>
      <p data-testid="airport-capacity">Airport Capacity: {capacity} planes</p>
      <p role="status" data-testid="hanger-count">Planes in hanger: {hangarCount}</p>
      <p data-testid="error-message"></p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={planeId}
          onChange={(e) => setPlaneId(e.target.value.trim())}
          placeholder="Enter plane ID"
          className="border p-2"
          data-testid="land-plane-input"
        />
        <button
          type="submit"
          className="bg-teal-500 text-white p-2 m-2"
          disabled={!isValidPlaneId(planeId)}
          data-testid="land-plane-button"
          role="button"
          aria-label="Land Plane"
        >
          Land Plane
        </button>
      </form>
      <select
        value={selectedPlane}
        onChange={(e) => setSelectedPlane(e.target.value)}
        className="border p-2 m-2"
        data-testid="plane-select"
      >
        <option value="">Select a plane</option>
        {hanger.map(plane => (
          <option key={plane.id} value={plane.id} data-testid={`plane-item-${plane.id}`}>{plane.id}</option>
        ))}
      </select>
      <button
        className="bg-red-500 text-white p-2 m-2"
        onClick={handleTakeOff}
        disabled={!selectedPlane}
        data-testid="takeoff-container"
      >
        Take Off Plane
      </button>
      <div className="mt-4">
        <input
          type="number"
          value={newCapacity}
          onChange={(e) => setNewCapacity(e.target.value)}
          placeholder="New Capacity"
          className="border p-2 mr-2"
        />
        <button
          onClick={handleCapacityChange}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Update Capacity
        </button>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Airport;