// Airport.js
import React, { useState } from 'react';
import Plane from './Plane';
import { isStormy } from './Weather';
import { Button, Box, Text } from '@chakra-ui/react';

const DEFAULT_CAPACITY = 5;

const Airport = () => {
  const [hanger, setHanger] = useState([]);
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);
  const [message, setMessage] = useState('');

  const land = (plane) => {
    try {
      if (hangerFull()) {
        throw new Error('Hanger full, abort landing!');
      }
      if (landed(plane)) {
        throw new Error('That plane is already here');
      }
      if (isStormy()) {
        throw new Error('Stormy weather, abort landing!');
      }
      plane.landed();
      setHanger([...hanger, plane]);
      setMessage('Plane landed successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const takeOff = (plane) => {
    try {
      if (!landed(plane)) {
        throw new Error("That plane isn't here");
      }
      if (isStormy()) {
        throw new Error('Stormy weather, cannot take off');
      }
      plane.inTheAir();
      setHanger(hanger.filter(p => p !== plane));
      setMessage('Plane took off successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const hangerFull = () => {
    return hanger.length >= capacity;
  };

  const landed = (plane) => {
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
