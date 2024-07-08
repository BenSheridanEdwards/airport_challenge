import React, { useState } from 'react';
import Plane from '../Plane/Plane';
import { isStormy } from '../Weather/Weather';
import { Button, Box, Text } from '@chakra-ui/react';

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
  const [hanger, setHanger] = useState<InstanceType<typeof PlaneClass>[]>([]);
  const [capacity] = useState<number>(DEFAULT_CAPACITY);
  const [message, setMessage] = useState<string>('');
  const [planeId, setPlaneId] = useState<string>('');

  const land = (plane: InstanceType<typeof PlaneClass>): Promise<void> => {
    return new Promise((resolve) => {
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
        if (typeof plane.landed === 'function') {
          plane.landed();
        } else {
          throw new Error('Plane does not have a landed method');
        }
        setHanger(prevHanger => {
          const updatedHanger = [...prevHanger, plane];
          return updatedHanger;
        });
        resolve();
        setMessage('Plane landed successfully.');
      } catch (error) {
        const errorMessage = (error as Error).message;
        setMessage(errorMessage);
        resolve();
      }
    });
  };

  const takeOff = (plane: InstanceType<typeof PlaneClass>): Promise<void> => {
    return new Promise((resolve) => {
      try {
        if (!landed(plane)) {
          throw new Error("No planes available for takeoff");
        }
        if (isStormy()) {
          throw new Error('Stormy weather, unable to take off!');
        }
        if (typeof plane.inTheAir === 'function') {
          plane.inTheAir();
        } else {
          throw new Error('Plane does not have an inTheAir method');
        }
        setHanger(prevHanger => {
          const updatedHanger = prevHanger.filter(p => p.id !== plane.id);
          return updatedHanger;
        });
        setMessage('Plane took off successfully.');
      } catch (error) {
        setMessage((error as Error).message);
      } finally {
        resolve();
      }
    });
  };

  const hangerFull = (): boolean => {
    return hanger.length >= capacity;
  };

  const landed = (plane: InstanceType<typeof PlaneClass>): boolean => {
    return hanger.some(p => p.id === plane.id);
  };

  const handleLand = (planeId?: string) => {
    if (hangerFull()) {
      setMessage('Hanger full, abort landing!');
      return;
    }
    if (planeId) {
      const plane = createPlane(planeId);
      land(plane).then(() => {});
    } else {
      const newPlaneId = generateUniqueId();
      if (!newPlaneId) {
        setMessage('Error generating unique ID, aborting landing process');
        return;
      }
      const newPlane = createPlane(newPlaneId);
      land(newPlane).then(() => {});
    }
    setPlaneId(''); // Clear the input field after landing
  };

  const handleTakeOff = (planeId?: string) => {
    if (planeId) {
      const plane = hanger.find(p => p.id === planeId);
      if (plane) {
        takeOff(plane);
      } else {
        setMessage("No planes available for takeoff");
      }
    } else {
      if (hanger.length > 0) {
        const plane = hanger[0];
        takeOff(plane);
      } else {
        setMessage('No planes available for takeoff.');
      }
    }
  };

  const createPlane = (id: string): InstanceType<typeof PlaneClass> => {
    if (!id) {
      throw new Error('Cannot create plane with undefined ID');
    }
    return new PlaneClass(id);
  };

  return (
    <Box p={4} data-testid="hanger-container">
      <Text fontSize="2xl">Airport</Text>
      <Text>Capacity: {capacity}</Text>
      <Text role="status" data-testid="hanger-count">Planes in hanger: {hanger.length}</Text>
      <input
        type="text"
        value={planeId}
        onChange={(e) => setPlaneId(e.target.value)}
        placeholder="Enter plane ID"
        data-testid="plane-id-input"
      />
      <Button colorScheme="teal" onClick={() => handleLand(planeId)} m={2}>Land Plane</Button>
      <Button colorScheme="red" onClick={() => handleTakeOff()} m={2} data-testid="takeoff-container">Take Off Plane</Button>
      {message && <Text role="status" mt={4} data-testid="message">{message}</Text>}
    </Box>
  );
};

export default Airport;
