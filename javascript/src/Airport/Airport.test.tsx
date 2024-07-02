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

  it('renders Airport component', () => {
    render(<Airport />);
    expect(screen.getByText('Airport')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 5')).toBeInTheDocument();
    expect(screen.getByText('Planes in hanger: 0')).toBeInTheDocument();
  });

  // Updated test cases to use specific plane IDs and ensure proper asynchronous handling

  it('lands a plane successfully', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await waitFor(() => {
      expect(screen.getByText(/Planes in hanger: 1/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('prevents landing when hanger is full', async () => {
    render(<Airport />);
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
      await waitFor(() => {
        expect(screen.getByText(new RegExp(`Planes in hanger: ${i + 1}`, 'i'))).toBeInTheDocument();
      }, { timeout: 3000 });
    }
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await waitFor(() => {
      expect(screen.getByText(/Hanger full, abort landing!/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await waitFor(() => {
      expect(screen.getByText(/Stormy weather, cannot land the plane!/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('prevents landing when plane is already in hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);
    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText(/That plane is already here/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('takes off a plane successfully', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(() => {
      expect(screen.getByText(/Planes in hanger: 0/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('prevents takeoff when weather is stormy', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(() => {
      expect(screen.getByText(/Stormy weather, unable to take off!/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('prevents takeoff when no planes are available', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(() => {
      expect(screen.getByText(/No planes available for takeoff/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
    await userEvent.click(landButton);
    await userEvent.click(takeOffButton);
    await userEvent.click(landButton);
    await userEvent.click(takeOffButton);
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByText(/That plane isn't here/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
