import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Airport from './Airport';

describe('Airport', () => {
  it('should display the correct initial capacity and planes in hanger', () => {
    render(<Airport />);
    expect(screen.getByText(/Capacity: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Planes in hanger: 0/i)).toBeInTheDocument();
  });

  it('should land a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByText(/Land Plane/i);
    fireEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText(/Plane landed successfully./i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Planes in hanger: 1/i)).toBeInTheDocument();
    });
  });

  it('should take off a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByText(/Land Plane/i);
    fireEvent.click(landButton);
    const takeOffButton = screen.getByText(/Take Off Plane/i);
    fireEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByText(/Planes in hanger: 0/i)).toBeInTheDocument();
    });
  });

  it('should display an error message when trying to land a plane in a full hanger', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5 (sunny)
    render(<Airport />);
    const landButton = screen.getByText(/Land Plane/i);
    for (let i = 0; i < 5; i++) {
      fireEvent.click(landButton);
      await waitFor(() => {
        expect(screen.getByText(/Plane landed successfully./i)).toBeInTheDocument();
      });
    }
    fireEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText(/Hanger full, abort landing!/i)).toBeInTheDocument();
    });
  });

  it('should display an error message when trying to land a plane during stormy weather', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0 (stormy)
    render(<Airport />);
    const landButton = screen.getByText(/Land Plane/i);
    fireEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText(/Stormy weather, abort landing!/i)).toBeInTheDocument();
    });
  });

  it('should display an error message when trying to take off a plane during stormy weather', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5 (sunny)
    render(<Airport />);
    const landButton = screen.getByText(/Land Plane/i);
    fireEvent.click(landButton);
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0 (stormy)
    const takeOffButton = screen.getByText(/Take Off Plane/i);
    fireEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByText(/Stormy weather, cannot take off/i)).toBeInTheDocument();
    });
  });
});
