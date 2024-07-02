import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  test('lands a plane successfully', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByText('Land Plane'));
    await waitFor(() => {
      expect(screen.getByText('Planes in hanger: 1')).toBeInTheDocument();
    });
  });

  test('prevents landing when hanger is full', async () => {
    render(<Airport />);
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByText('Land Plane'));
    }
    await userEvent.click(screen.getByText('Land Plane'));
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Hanger full, abort landing!'))).toBeInTheDocument();
    });
  });

  test('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport />);
    await userEvent.click(screen.getByText('Land Plane'));
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Stormy weather, cannot land the plane!'))).toBeInTheDocument();
    });
  });

  test('prevents landing when plane is already in hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByText('Land Plane');
    await userEvent.click(landButton);
    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('That plane is already here'))).toBeInTheDocument();
    });
  });

  test('takes off a plane successfully', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByText('Land Plane'));
    await userEvent.click(screen.getByText('Take Off Plane'));
    await waitFor(() => {
      expect(screen.getByText('Planes in hanger: 0')).toBeInTheDocument();
    });
  });

  test('prevents takeoff when weather is stormy', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByText('Land Plane'));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByText('Take Off Plane'));
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Stormy weather, unable to take off!'))).toBeInTheDocument();
    });
  });

  test('prevents takeoff when no planes are available', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByText('Take Off Plane'));
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('No planes available for takeoff.'))).toBeInTheDocument();
    });
  });

  test('prevents takeoff when plane is not in hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByText('Land Plane');
    const takeOffButton = screen.getByText('Take Off Plane');
    await userEvent.click(landButton);
    await userEvent.click(takeOffButton);
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('That plane isn\'t here'))).toBeInTheDocument();
    });
  });
});
