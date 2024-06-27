import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';

jest.mock('../Weather/Weather', () => ({
  isStormy: jest.fn(),
}));

describe('Airport Component', () => {
  beforeEach(() => {
    (isStormy as jest.Mock).mockReturnValue(false);
  });

  test('renders Airport component', () => {
    render(<Airport />);
    expect(screen.getByText('Airport')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 5')).toBeInTheDocument();
    expect(screen.getByText('Planes in hanger: 0')).toBeInTheDocument();
  });

  test('lands a plane successfully', () => {
    render(<Airport />);
    fireEvent.click(screen.getByText('Land Plane'));
    expect(screen.getByText('Plane landed successfully.')).toBeInTheDocument();
    expect(screen.getByText('Planes in hanger: 1')).toBeInTheDocument();
  });

  test('prevents landing when hanger is full', () => {
    render(<Airport />);
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Land Plane'));
    }
    fireEvent.click(screen.getByText('Land Plane'));
    expect(screen.getByText('Hanger full, abort landing!')).toBeInTheDocument();
  });

  test('prevents landing when weather is stormy', () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport />);
    fireEvent.click(screen.getByText('Land Plane'));
    expect(screen.getByText('Stormy weather, abort landing!')).toBeInTheDocument();
  });

  test('takes off a plane successfully', () => {
    render(<Airport />);
    fireEvent.click(screen.getByText('Land Plane'));
    fireEvent.click(screen.getByText('Take Off Plane'));
    expect(screen.getByText('Plane took off successfully.')).toBeInTheDocument();
    expect(screen.getByText('Planes in hanger: 0')).toBeInTheDocument();
  });

  test('prevents takeoff when weather is stormy', () => {
    render(<Airport />);
    fireEvent.click(screen.getByText('Land Plane'));
    (isStormy as jest.Mock).mockReturnValue(true);
    fireEvent.click(screen.getByText('Take Off Plane'));
    expect(screen.getByText('Stormy weather, cannot take off')).toBeInTheDocument();
  });

  test('prevents takeoff when no planes are available', () => {
    render(<Airport />);
    fireEvent.click(screen.getByText('Take Off Plane'));
    expect(screen.getByText('No planes available for takeoff.')).toBeInTheDocument();
  });
});
