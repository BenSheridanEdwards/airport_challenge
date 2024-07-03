import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';

jest.setTimeout(10000);

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

  it('lands a plane successfully', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    expect(await screen.findByText(/Planes in hanger: 1/)).toBeInTheDocument();
  });

  it('prevents landing when hanger is full', async () => {
    render(<Airport />);
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
      expect(await screen.findByText(new RegExp(`Planes in hanger: ${i + 1}`))).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    expect(await screen.findByText(/Hanger full, abort landing!/)).toBeInTheDocument();
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    expect(await screen.findByText('Stormy weather, cannot land the plane!')).toBeInTheDocument();
  });

  it('prevents landing when plane is already in hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);
    expect(await screen.findByText('Planes in hanger: 1')).toBeInTheDocument();
    await userEvent.click(landButton);
    expect(await screen.findByText('That plane is already here')).toBeInTheDocument();
  });

  it('takes off a plane successfully', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    expect(await screen.findByText('Planes in hanger: 0')).toBeInTheDocument();
  });

  it('prevents takeoff when weather is stormy', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    expect(await screen.findByText('Stormy weather, unable to take off!')).toBeInTheDocument();
  });

  it('prevents takeoff when no planes are available', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    expect(await screen.findByText('No planes available for takeoff')).toBeInTheDocument();
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
    await userEvent.click(landButton);
    expect(await screen.findByText('Plane landed successfully.')).toBeInTheDocument();
    await userEvent.click(takeOffButton);
    expect(await screen.findByText('Plane took off successfully.')).toBeInTheDocument();
    await userEvent.click(takeOffButton);
    expect(await screen.findByText(/That plane isn't here/)).toBeInTheDocument();
  });

  it('handles multiple planes landing and taking off in sequence', async () => {
    render(<Airport />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land 3 planes
    for (let i = 0; i < 3; i++) {
      await userEvent.click(landButton);
      expect(await screen.findByText(new RegExp(`Planes in hanger: ${i + 1}`))).toBeInTheDocument();
    }

    // Take off 2 planes
    for (let i = 2; i >= 1; i--) {
      await userEvent.click(takeOffButton);
      expect(await screen.findByText(new RegExp(`Planes in hanger: ${i}`))).toBeInTheDocument();
    }

    // Land 2 more planes
    for (let i = 1; i <= 2; i++) {
      await userEvent.click(landButton);
      expect(await screen.findByText(new RegExp(`Planes in hanger: ${i + 1}`))).toBeInTheDocument();
    }
  });

  it('displays appropriate error message when weather turns stormy during landing', async () => {
    render(<Airport />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Start landing process
    await userEvent.click(landButton);
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to land another plane
    await userEvent.click(landButton);
    expect(await screen.findByText(/Stormy weather, cannot land the plane!/)).toBeInTheDocument();
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    render(<Airport />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land a plane
    await userEvent.click(landButton);
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to take off the plane
    await userEvent.click(takeOffButton);
    expect(await screen.findByText(/Stormy weather, unable to take off!/)).toBeInTheDocument();
  });

  it('ensures state persistence across different actions', async () => {
    render(<Airport />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land a plane
    await userEvent.click(landButton);
    expect(await screen.findByText('Planes in hanger: 1')).toBeInTheDocument();

    // Take off the plane
    await userEvent.click(takeOffButton);
    expect(await screen.findByText('Planes in hanger: 0')).toBeInTheDocument();

    // Land another plane
    await userEvent.click(landButton);
    expect(await screen.findByText('Planes in hanger: 1')).toBeInTheDocument();
  });

  it('verifies that isStormy mock function is called', async () => {
    render(<Airport />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Land a plane
    await userEvent.click(landButton);
    expect(isStormy).toHaveBeenCalled();
  });
});
