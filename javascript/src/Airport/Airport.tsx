import React, { useState } from 'react';
import Plane from '../Plane/Plane';
import { isStormy } from '../Weather/Weather';
import { Button, Box, Text } from '@chakra-ui/react';

const DEFAULT_CAPACITY = 5;

const Airport: React.FC = () => {
  const [hanger, setHanger] = useState<Plane[]>([]);
  const [capacity, setCapacity] = useState<number>(DEFAULT_CAPACITY);
  const [message, setMessage] = useState<string>('');

  const land = (plane: Plane) => {
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
      setHanger([...hanger, plane]);
      setMessage('Plane landed successfully.');
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const takeOff = (plane: Plane) => {
    try {
      if (!landed(plane)) {
        throw new Error("That plane isn't here");
      }
      if (isStormy()) {
        throw new Error('Stormy weather, cannot take off the plane!');
      }
      plane.inTheAir();
      setHanger(hanger.filter(p => p !== plane));
      setMessage('Plane took off successfully.');
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const hangerFull = (): boolean => {
    return hanger.length >= capacity;
  };

  const landed = (plane: Plane): boolean => {
    return hanger.includes(plane);
  };

  const handleLand = () => {
    const plane = new Plane();
    land(plane);
  };

  const handleTakeOff = () => {
    if (hanger.length > 0) {
      const plane = hanger[0];
      takeOff(plane);
    } else {
      setMessage('No planes available for takeoff.');
    }
  };

  return (
    <Box p={4}>
      <Text fontSize="2xl">Airport</Text>
      <Text>Capacity: {capacity}</Text>
      <Text>Planes in hanger: {hanger.length}</Text>
      <Button colorScheme="teal" onClick={handleLand} m={2}>Land Plane</Button>
      <Button colorScheme="red" onClick={handleTakeOff} m={2}>Take Off Plane</Button>
      {message && <Text mt={4}>{message}</Text>}
    </Box>
  );
};

export default Airport;
