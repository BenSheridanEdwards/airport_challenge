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
  return '_' + Math.random().toString(36).substr(2, 9);
};

const Airport: React.FC<AirportProps> = ({ PlaneClass = Plane, generateUniqueId = defaultGenerateUniqueId }) => {
  const [hanger, setHanger] = useState<InstanceType<typeof PlaneClass>[]>([]);
  const [capacity] = useState<number>(DEFAULT_CAPACITY);
  const [message, setMessage] = useState<string>('');

  const land = (plane: InstanceType<typeof PlaneClass>) => {
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
      setHanger(prevHanger => [...prevHanger, plane]);
      setMessage('Plane landed successfully.');
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const takeOff = (plane: InstanceType<typeof PlaneClass>) => {
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
      setHanger(prevHanger => prevHanger.filter(p => p.id !== plane.id));
      setMessage('Plane took off successfully.');
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const hangerFull = (): boolean => {
    return hanger.length >= capacity;
  };

  const landed = (plane: InstanceType<typeof PlaneClass>): boolean => {
    return hanger.some(p => p.id === plane.id);
  };

  const handleLand = async (planeId?: string) => {
    if (hangerFull()) {
      setMessage('Hanger full, abort landing!');
      return;
    }
    if (planeId) {
      const plane = createPlane(planeId);
      land(plane);
    } else {
      const newPlane = createPlane(generateUniqueId());
      land(newPlane);
    }
  };

  const handleTakeOff = async (planeId?: string) => {
    if (planeId) {
      const plane = hanger.find(p => p.id === planeId);
      if (plane) {
        await takeOff(plane);
      } else {
        setMessage("No planes available for takeoff");
      }
    } else {
      if (hanger.length > 0) {
        const plane = hanger[0];
        await takeOff(plane);
      } else {
        setMessage('No planes available for takeoff.');
      }
    }
  };

  const createPlane = (id: string): InstanceType<typeof PlaneClass> => {
    return new PlaneClass(id);
  };

  return (
    <Box p={4} data-testid="hanger-container">
      <Text fontSize="2xl">Airport</Text>
      <Text>Capacity: {capacity}</Text>
      <Text role="status" data-testid="hanger-count">Planes in hanger: {hanger.length}</Text>
      <Button colorScheme="teal" onClick={() => handleLand()} m={2}>Land Plane</Button>
      <Button colorScheme="red" onClick={() => handleTakeOff()} m={2} data-testid="takeoff-container">Take Off Plane</Button>
      {message && <Text role="status" mt={4} data-testid="hanger-1">{message}</Text>}
    </Box>
  );
};

export default Airport;
