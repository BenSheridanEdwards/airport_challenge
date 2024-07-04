import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport/Airport';

// Remove the redundant global timeout
// jest.setTimeout(10000);

describe('Airport', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  it('should display the correct initial capacity and planes in hanger', async () => {
    render(<Airport />);
    await waitFor(() => {
      expect(screen.getByText('Capacity: 5')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    });
  });

  it('should land a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    await waitFor(async () => {
      const message = await screen.findByText(/Plane landed successfully./);
      expect(message).toBeInTheDocument();
    });
    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 15000 });
  });

  it('should take off a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    await waitFor(async () => {
      const message = await screen.findByText(/Plane landed successfully./);
      expect(message).toBeInTheDocument();
    });
    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 15000 });
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    await waitFor(async () => {
      const takeOffMessage = await screen.findByText(/Plane took off successfully./);
      expect(takeOffMessage).toBeInTheDocument();
    });
    await waitFor(async () => {
      const updatedHangerCount = await screen.findByTestId('hanger-count');
      expect(updatedHangerCount).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: 15000 });
  });

  it('should display an error message when trying to land a plane in a full hanger', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5 (sunny)
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    for (let i = 0; i < 5; i++) {
      await userEvent.click(landButton);
      await waitFor(async () => {
        const hangerCount = await screen.findByTestId('hanger-count');
        expect(hangerCount).toHaveTextContent(`Planes in hanger: ${i + 1}`);
      }, { timeout: 15000 });
    }
    // Attempt one more landing to ensure the hanger is full
    await userEvent.click(landButton);
    await waitFor(async () => {
      const errorMessage = await screen.findByText(/Hanger full, abort landing!/);
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 15000 });
    jest.restoreAllMocks(); // Restore Math.random mock
  });

  it('should display an error message when trying to land a plane that is already in the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 15000 });
    // Attempt to land the same plane again
    await userEvent.click(landButton);
    await waitFor(async () => {
      const errorMessage = await screen.findByText((content, element) => {
        return element.textContent.includes('That plane is already here');
      });
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 15000 });
  });

  it('should display an error message when trying to take off a plane during stormy weather', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 15000 });
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0 (stormy)
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    await waitFor(async () => {
      const errorMessage = await screen.findByText(/Stormy weather, unable to take off!/);
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 15000 });
    jest.restoreAllMocks(); // Restore Math.random mock
  });

  it('should display an error message when trying to take off a plane that is not in the hanger', async () => {
    render(<Airport />);
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    await waitFor(async () => {
      expect(await screen.findByText(/No planes available for takeoff/)).toBeInTheDocument();
    });
  });

  it('should display a message when there are no planes available for takeoff', async () => {
    render(<Airport />);
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    await waitFor(async () => {
      expect(await screen.findByText(/No planes available for takeoff/)).toBeInTheDocument();
    });
  });
});
