import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport/Airport';

let mockIdCounter = 0; // Initialize the counter before the test suite

jest.mock('./Airport/Airport', () => {
  const originalModule = jest.requireActual('./Airport/Airport');
  return {
    __esModule: true,
    ...originalModule,
    generateUniqueId: jest.fn(() => {
      const id = `test-plane-id-${mockIdCounter++}`;
      return id;
    }),
  };
});

beforeAll(() => {
  jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5 (sunny)
});

afterEach(() => {
  cleanup();
});

describe('Airport', () => {
  it('should display the correct initial capacity and planes in hanger', async () => {
    render(<Airport generateUniqueId={() => `test-plane-id-${mockIdCounter++}`} />);
    expect(await screen.findByText('Capacity: 5')).toBeInTheDocument();
    expect(await screen.findByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
  });

  // Test case for landing a plane and updating the hanger
  it('should land a plane and update the hanger', async () => {
    render(<Airport generateUniqueId={() => `test-plane-id-${mockIdCounter++}`} />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    const message = await screen.findByText((content) => content.replace(/\s+/g, ' ').trim().includes('Plane landed successfully.'));
    expect(message).toBeInTheDocument();
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 10000 });
  });

  // Test case for taking off a plane and updating the hanger
  it('should take off a plane and update the hanger', async () => {
    render(<Airport generateUniqueId={() => `test-plane-id-${mockIdCounter++}`} />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    const message = await screen.findByText((content) => content.replace(/\s+/g, ' ').trim().includes('Plane landed successfully.'));
    expect(message).toBeInTheDocument();
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 10000 });
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    const takeOffMessage = await screen.findByText(/Plane took off successfully\./);
    expect(takeOffMessage).toBeInTheDocument();
    await waitFor(() => {
      const updatedHangerCount = screen.getByTestId('hanger-count');
      expect(updatedHangerCount).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: 10000 });
  });

  it('should display an error message when trying to take off a plane during stormy weather', async () => {
    render(<Airport generateUniqueId={() => `test-plane-id-${mockIdCounter++}`} />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    const hangerCount = await screen.findByTestId('hanger-count');
    await waitFor(() => expect(hangerCount).toHaveTextContent('Planes in hanger: 1'), { timeout: 5000 });
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0 (stormy)
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      const errorMessage = screen.getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Stormy weather, unable to take off!'));
      expect(errorMessage).toBeInTheDocument();
    });
    jest.restoreAllMocks(); // Restore Math.random mock
  });

  // Test case for landing a plane in a full hanger
  it('should display an error message when trying to land a plane in a full hanger', async () => {
    render(<Airport generateUniqueId={() => `test-plane-id-${mockIdCounter++}`} />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    for (let i = 0; i < 5; i++) {
      await userEvent.click(landButton);
      await waitFor(() => {
        const hangerCount = screen.getByTestId('hanger-count');
        expect(hangerCount).toHaveTextContent(`Planes in hanger: ${i + 1}`);
      }, { timeout: 10000 });
    }
    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 5');
    }, { timeout: 10000 });
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Ensure sunny weather
    await userEvent.click(landButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 5');
    }, { timeout: 10000 });

    await waitFor(() => {
      const errorMessage = screen.getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Hanger full, abort landing!'));
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  // Test case for landing a plane that is already in the hanger
  it('should display an error message when trying to land a plane that is already in the hanger', async () => {
    render(<Airport generateUniqueId={() => `test-plane-id-${mockIdCounter++}`} />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    const mockPlane = { id: 'test-plane-id-0', landed: jest.fn(), inTheAir: jest.fn() };
    // Mock the plane creation to always return the same plane
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // Ensure sunny weather
    jest.spyOn(global, 'Date').mockImplementation(() => ({ getTime: () => mockPlane.id }));
    // Set the planeId input field to the mock plane's ID
    const planeIdInput = await screen.findByTestId('plane-id-input');
    await userEvent.type(planeIdInput, mockPlane.id);
    await userEvent.click(landButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 10000 });
    // Attempt to land the same plane again
    await userEvent.type(planeIdInput, mockPlane.id);
    await userEvent.click(landButton);
    const errorMessage = await screen.findByText((content) => content.replace(/\s+/g, ' ').trim().includes('That plane is already here'));
    expect(errorMessage).toBeInTheDocument();
  });

  it('should display an error message when trying to take off a plane that is not in the hanger', async () => {
    render(<Airport generateUniqueId={() => `test-plane-id-${mockIdCounter++}`} />);
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    const errorMessage = await screen.findByText(/No planes available for takeoff/);
    expect(errorMessage).toBeInTheDocument();
  });

  it('should display a message when there are no planes available for takeoff', async () => {
    render(<Airport generateUniqueId={() => `test-plane-id-${mockIdCounter++}`} />);
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    expect(await screen.findByText(/No planes available for takeoff/)).toBeInTheDocument();
  });
});
// End of test cases for Airport component
