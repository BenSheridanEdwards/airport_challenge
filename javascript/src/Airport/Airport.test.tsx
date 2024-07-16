import React from 'react';
import { render, screen, waitFor, within, act, getByTestId } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';
import { toast, ToastContainer } from 'react-toastify';

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

const TIMEOUT = 10000; // Increased timeout to 10 seconds


const landMultiplePlanes = async (count: number) => {
  const landButton = await screen.findByTestId('land-plane-button');
  const planeIdInput = await screen.findByTestId('land-plane-input');

  for (let i = 0; i < count; i++) {
    const planeId = `plane-${i + 1}`;
    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);
    await new Promise(resolve => setTimeout(resolve, 100)); // Add small delay
    await screen.findByText(`Planes in hanger: ${i + 1}`);
  }
};

const takeOffMultiplePlanes = async (count: number) => {
  const takeOffButton = await screen.findByTestId('takeoff-container');

  for (let i = 0; i < count; i++) {
    await userEvent.click(takeOffButton);
    await new Promise(resolve => setTimeout(resolve, 100)); // Add small delay
    await waitFor(() => {
      const expectedCount = count - i - 1;
      expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${expectedCount}`);
    }, { timeout: TIMEOUT });
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
    jest.useFakeTimers();
    render(<Airport PlaneClass={MockPlane} />);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay after rendering
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
    console.log('Initial render:');
    screen.debug();

    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');
    const planeId = 'test-plane-1';

    await act(async () => {
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    });

    console.log('After landing plane:');
    screen.debug();

    await waitFor(() => {
      expect(screen.findByTestId('hanger-count')).resolves.toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when hanger is full', async () => {
    await landMultiplePlanes(5);
    const landButton = await screen.findByTestId('land-plane-button');
    await act(async () => {
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100)); // Add small delay
    });

    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 5');
      expect(toast.error).toHaveBeenCalledWith('Hanger full, abort landing!');
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    const landButton = await screen.findByTestId('land-plane-button');
    await act(async () => {
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100)); // Add small delay
    });

    screen.debug(); // Add debug output

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, cannot land the plane!');
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when plane is already in hanger', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');
    const planeId = 'test-plane-id';

    await act(async () => {
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    screen.debug();

    await act(async () => {
      await userEvent.clear(planeIdInput);
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    screen.debug();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('That plane is already here');
    }, { timeout: TIMEOUT });
  });

  it('takes off a plane successfully', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeoffButton = await screen.findByTestId('takeoff-container');

    await act(async () => {
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100));
      await userEvent.click(takeoffButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    console.log('After takeoff:');
    screen.debug();

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when weather is stormy', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    await act(async () => {
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    (isStormy as jest.Mock).mockReturnValue(true);
    const takeoffButton = await screen.findByTestId('takeoff-container');
    await act(async () => {
      await userEvent.click(takeoffButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, unable to take off!');
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when no planes are available', async () => {
    const takeoffButton = await screen.findByTestId('takeoff-container');
    await act(async () => {
      await userEvent.click(takeoffButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No planes available for takeoff.');
    }, { timeout: TIMEOUT });

    screen.debug();
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = await screen.findByTestId('takeoff-container');

    await act(async () => {
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    await act(async () => {
      await userEvent.click(takeOffButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });

    await act(async () => {
      await userEvent.click(takeOffButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No planes available for takeoff.');
    }, { timeout: TIMEOUT });
  });

  it('handles multiple planes landing', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    for (let i = 0; i < 3; i++) {
      const planeId = `plane-${i + 1}`;
      await act(async () => {
        await userEvent.type(planeIdInput, planeId);
        await userEvent.click(landButton);
        await new Promise(resolve => setTimeout(resolve, 100)); // Add small delay
      });

      await waitFor(async () => {
        const hangerCount = await screen.findByTestId('hanger-count');
        expect(hangerCount).toHaveTextContent(`Planes in hanger: ${i + 1}`);
      }, { timeout: TIMEOUT });
    }
    screen.debug(); // Add debug output after all planes have landed
  });

  it('handles multiple planes taking off', async () => {
    await landMultiplePlanes(3);
    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 3');
    }, { timeout: TIMEOUT });

    await takeOffMultiplePlanes(2);
    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    screen.debug(); // Add debug output after operations
  });

  it('verifies plane IDs in the hangar after multiple operations', async () => {
    await landMultiplePlanes(3);
    await takeOffMultiplePlanes(2);
    await landMultiplePlanes(2);

    await waitFor(async () => {
      const hangarPlanes = await screen.findAllByTestId('plane-item');
      expect(hangarPlanes).toHaveLength(3);
      expect(hangarPlanes.map(plane => plane.textContent)).toEqual(['plane-1', 'plane-4', 'plane-5']);
    }, { timeout: TIMEOUT });

    screen.debug(); // Add this line to help diagnose rendering issues
  });

  it('displays appropriate error message when weather turns stormy during landing', async () => {
    const landButton = await screen.findByTestId('land-plane-button');

    await act(async () => {
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    (isStormy as jest.Mock).mockReturnValue(true);
    await act(async () => {
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    screen.debug();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, cannot land the plane!');
    }, { timeout: TIMEOUT });
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    await act(async () => {
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    (isStormy as jest.Mock).mockReturnValue(true);
    const takeoffButton = await screen.findByTestId('takeoff-container');
    await act(async () => {
      await userEvent.click(takeoffButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, unable to take off!');
    }, { timeout: TIMEOUT });

    screen.debug();
  });

  it('ensures state persistence across different actions', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = await screen.findByTestId('takeoff-container');

    await act(async () => {
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    await act(async () => {
      await userEvent.click(takeOffButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });

    await act(async () => {
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });
  });

  it('verifies that isStormy mock function is called during landing and takeoff', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = await screen.findByTestId('takeoff-container');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    await act(async () => {
      await userEvent.type(planeIdInput, 'test-plane');
      await userEvent.click(landButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await waitFor(() => expect(isStormy).toHaveBeenCalled(), { timeout: TIMEOUT });

    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    jest.clearAllMocks();

    await act(async () => {
      await userEvent.click(takeOffButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await waitFor(() => expect(isStormy).toHaveBeenCalled(), { timeout: TIMEOUT });

    await waitFor(async () => {
      const hangerCount = await screen.findByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });
  });
});