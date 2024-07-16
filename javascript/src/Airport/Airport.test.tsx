import React from 'react';
import { render, screen, waitFor, within, act, getByTestId } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';
import { toast, ToastContainer } from 'react-toastify';

jest.setTimeout(60000); // Increase timeout to 60 seconds

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn() },
  ToastContainer: () => null
}));

interface MockPlaneInstance {
  id: string;
  airborn: boolean;
  landed: jest.Mock;
  inTheAir: jest.Mock;
}

jest.mock('../Plane/Plane', () => {
  const mockPlanes: MockPlaneInstance[] = [];
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((id: string) => {
      const plane = {
        id: id || '_' + Math.random().toString(36).substr(2, 9),
        airborn: false,
        landed: jest.fn().mockReturnThis(),
        inTheAir: jest.fn().mockReturnThis(),
      };
      mockPlanes.push(plane);
      return plane;
    }),
    instances: mockPlanes,
  };
});

jest.mock('../Weather/Weather', () => ({
  isStormy: jest.fn(),
}));

// Removed TIMEOUT constant

const landMultiplePlanes = async (count: number) => {
  const landButton = await screen.findByTestId('land-plane-button');
  const planeIdInput = await screen.findByTestId('land-plane-input');

  for (let i = 0; i < count; i++) {
    const planeId = `plane-${i + 1}`;
    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${i + 1}`);
    });
  }
};

const takeOffMultiplePlanes = async (count: number) => {
  const takeOffButton = await screen.findByTestId('takeoff-container');

  for (let i = 0; i < count; i++) {
    console.log(`Taking off plane ${i + 1} of ${count}`);
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      const expectedCount = count - i - 1;
      expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${expectedCount}`);
    });
    console.log(`Plane ${i + 1} took off successfully`);
  }
};

describe('Airport Component', () => {
  const MockPlane = jest.requireActual('../Plane/Plane').default;

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    (isStormy as jest.Mock).mockReturnValue(false);
    jest.requireMock('../Plane/Plane').instances.length = 0;
    document.body.innerHTML = '';
    render(<Airport PlaneClass={MockPlane} />);
    await waitFor(() => {
      expect(screen.getByTestId('airport-heading')).toBeInTheDocument();
    });
    console.log('Initial render:');
    screen.debug();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders Airport component', async () => {
    console.log('Rendered Airport component:');
    screen.debug();
    expect(await screen.findByTestId('airport-heading')).toBeInTheDocument();
    expect(await screen.findByTestId('airport-capacity')).toBeInTheDocument();
    expect(await screen.findByTestId('hanger-count')).toBeInTheDocument();
  });

  it('lands a plane successfully', async () => {
    console.log('Starting land plane test');
    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');
    const planeId = 'test-plane-1';

    console.log('Before landing plane');
    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);
    console.log('After landing plane');

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });
    console.log('Plane landed successfully');
  });

  it('prevents landing when hanger is full', async () => {
    await landMultiplePlanes(5);
    const landButton = await screen.findByTestId('land-plane-button');
    await userEvent.click(landButton);

    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 5');
      expect(toast.error).toHaveBeenCalledWith('Hanger full, abort landing!');
    });
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    const landButton = await screen.findByTestId('land-plane-button');
    await userEvent.click(landButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, cannot land the plane!');
    });

    const hangerCount = await screen.findByTestId('hanger-count');
    expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
  });

  it('prevents landing when plane is already in hanger', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');
    const planeId = 'test-plane-id';

    await act(async () => {
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });

    await act(async () => {
      await userEvent.clear(planeIdInput);
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('That plane is already here');
    });
  });

  it('takes off a plane successfully', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeoffButton = await screen.findByTestId('takeoff-container');

    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });

    await userEvent.click(takeoffButton);

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    });

    console.log('After takeoff:');
    screen.debug();
  });

  it('prevents takeoff when weather is stormy', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });

    (isStormy as jest.Mock).mockReturnValue(true);
    const takeoffButton = await screen.findByTestId('takeoff-container');
    await userEvent.click(takeoffButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, unable to take off!');
    });

    expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
  });

  it('prevents takeoff when no planes are available', async () => {
    const takeoffButton = await screen.findByTestId('takeoff-container');
    await userEvent.click(takeoffButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No planes available for takeoff.');
    });

    screen.debug();
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = await screen.findByTestId('takeoff-container');

    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });

    await userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    });

    await userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No planes available for takeoff.');
    });
  });

  it('handles multiple planes landing', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    for (let i = 0; i < 3; i++) {
      const planeId = `plane-${i + 1}`;
      await act(async () => {
        await userEvent.type(planeIdInput, planeId);
        await userEvent.click(landButton);
      });

      await waitFor(() => {
        const hangerCount = screen.getByTestId('hanger-count');
        expect(hangerCount).toHaveTextContent(`Planes in hanger: ${i + 1}`);
      });
    }

    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 3');
    });
  });

  it('handles multiple planes taking off', async () => {
    await landMultiplePlanes(3);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 3');
    });

    await takeOffMultiplePlanes(2);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });

    screen.debug(); // Add debug output after operations
  });

  it('verifies plane IDs in the hangar after multiple operations', async () => {
    await landMultiplePlanes(3);
    await takeOffMultiplePlanes(2);
    await landMultiplePlanes(2);

    await waitFor(() => {
      const hangarPlanes = screen.getAllByTestId('plane-item');
      expect(hangarPlanes).toHaveLength(3);
      const planeIds = hangarPlanes.map(plane => plane.textContent);
      expect(planeIds).toEqual(['plane-3', 'plane-4', 'plane-5']);
    });

    console.log('Hangar state after multiple operations:');
    screen.debug();
  });

  it('displays appropriate error message when weather turns stormy during landing', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    // Land the first plane
    await userEvent.type(planeIdInput, 'plane-1');
    await userEvent.click(landButton);
    await waitFor(() => expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1'));

    // Mock stormy weather
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to land another plane
    await userEvent.clear(planeIdInput);
    await userEvent.type(planeIdInput, 'plane-2');
    await userEvent.click(landButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, cannot land the plane!', expect.anything());
    });

    // Verify that the hangar count remains unchanged
    expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');

    // Verify that only the first plane is in the hangar
    const hangarPlanes = screen.getAllByTestId('plane-item');
    expect(hangarPlanes).toHaveLength(1);
    expect(hangarPlanes[0].textContent).toBe('plane-1');
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    await userEvent.click(landButton);

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });

    (isStormy as jest.Mock).mockReturnValue(true);
    const takeoffButton = await screen.findByTestId('takeoff-container');
    await userEvent.click(takeoffButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, unable to take off!');
    });

    expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
  });

  it('ensures state persistence across different actions', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = await screen.findByTestId('takeoff-container');

    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });

    await userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    });

    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });
  });

  it('verifies that isStormy mock function is called during landing and takeoff', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = await screen.findByTestId('takeoff-container');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    await userEvent.type(planeIdInput, 'test-plane');
    await userEvent.click(landButton);

    await waitFor(() => {
      expect(isStormy).toHaveBeenCalled();
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });

    jest.clearAllMocks();

    await userEvent.click(takeOffButton);

    await waitFor(() => {
      expect(isStormy).toHaveBeenCalled();
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    });
  });
});