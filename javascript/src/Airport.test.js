import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport/Airport';

describe('Airport', () => {
  it('should display the correct initial capacity and planes in hanger', () => {
    render(<Airport />);
    expect(screen.getByText(/Capacity: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Planes in hanger: 0/i)).toBeInTheDocument();
  });

  it('should land a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByText(/Land Plane/i);
    userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText(/Planes in hanger: 1/i)).toBeInTheDocument();
    });
  });

  it('should take off a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByText(/Land Plane/i);
    userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText(/Planes in hanger: 1/i)).toBeInTheDocument();
    });
    const takeOffButton = screen.getByText(/Take Off Plane/i);
    userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByText(/Planes in hanger: 0/i)).toBeInTheDocument();
    });
  });

  it('should display an error message when trying to land a plane in a full hanger', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5 (sunny)
    render(<Airport />);
    const landButton = screen.getByText(/Land Plane/i);
    for (let i = 0; i < 5; i++) {
      userEvent.click(landButton);
      await waitFor(() => {
        expect(screen.getByText(/Planes in hanger: \d+/i)).toBeInTheDocument();
      });
    }
    userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText(/Hanger full, abort landing!/i)).toBeInTheDocument();
    });
  });

  it('should display an error message when trying to land a plane during stormy weather', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0 (stormy)
    render(<Airport />);
    const landButton = screen.getByText(/Land Plane/i);
    userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText(/Stormy weather, cannot land the plane!/i)).toBeInTheDocument();
    });
  });

  it('should display an error message when trying to take off a plane during stormy weather', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5 (sunny)
    render(<Airport />);
    const landButton = screen.getByText(/Land Plane/i);
    userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText(/Planes in hanger: 1/i)).toBeInTheDocument();
    });
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0 (stormy)
    const takeOffButton = screen.getByText(/Take Off Plane/i);
    userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByText(/Stormy weather, unable to take off!/i)).toBeInTheDocument();
    });
  });

  it('should display an error message when trying to land a plane that is already in the hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByText(/Land Plane/i);
    userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText(/Planes in hanger: 1/i)).toBeInTheDocument();
    });
    userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText(/That plane is already here/i)).toBeInTheDocument();
    });
  });

  it('should display an error message when trying to take off a plane that is not in the hanger', async () => {
    render(<Airport />);
    const takeOffButton = screen.getByText(/Take Off Plane/i);
    userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByText(/That plane isn't here/i)).toBeInTheDocument();
    });
  });

  it('should display a message when there are no planes available for takeoff', async () => {
    render(<Airport />);
    const takeOffButton = screen.getByText(/Take Off Plane/i);
    userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByText(/No planes available for takeoff./i)).toBeInTheDocument();
    });
  });
});
