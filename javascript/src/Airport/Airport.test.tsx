import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';
import { toast } from 'react-toastify';

jest.setTimeout(60000);

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  },
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
    await userEvent.clear(planeIdInput);
    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${i + 1}`);
    });
    await waitFor(() => {
      expect(screen.getByTestId('land-plane-input')).toHaveValue('');
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
    (isStormy as jest.Mock).mockImplementation(() => false);
    jest.requireMock('../Plane/Plane').instances.length = 0;
    document.body.innerHTML = '';

    await act(async () => {
      render(<Airport PlaneClass={MockPlane} />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('airport-heading')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders Airport component', async () => {
    const airportHeading = await screen.findByTestId('airport-heading');
    expect(airportHeading).toBeInTheDocument();

    const airportCapacity = await screen.findByTestId('airport-capacity');
    expect(airportCapacity).toBeInTheDocument();

    const hangerCount = await screen.findByTestId('hanger-count');
    expect(hangerCount).toBeInTheDocument();
  });

  it('lands a plane successfully', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');
    const planeId = 'test-plane-1';

    await act(async () => {
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 15000 });

    await waitFor(() => {
      expect(isStormy).toHaveBeenCalled();
    }, { timeout: 15000 });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(`Plane ${planeId} has landed`, expect.anything());
    }, { timeout: 15000 });

    await waitFor(async () => {
      const planeItems = await screen.findAllByTestId('plane-item');
      expect(planeItems).toHaveLength(1);
      expect(planeItems[0]).toHaveTextContent(planeId);
    }, { timeout: 15000 });
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

    expect(isStormy).toHaveBeenCalled();
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);

    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    await act(async () => {
      await userEvent.type(planeIdInput, 'test-plane');
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(isStormy).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, cannot land the plane!');
    }, { timeout: 5000 });

    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: 5000 });
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
    }, { timeout: 5000 });

    await act(async () => {
      await userEvent.clear(planeIdInput);
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('That plane is already here');
    }, { timeout: 5000 });

    expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
  });

  it('takes off a plane successfully', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeoffButton = await screen.findByTestId('takeoff-container');
    const planeId = 'test-plane-1';

    await act(async () => {
      await userEvent.type(screen.getByTestId('land-plane-input'), planeId);
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 15000 });

    await act(async () => {
      await userEvent.click(takeoffButton);
    });

    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: 15000 });

    await waitFor(() => {
      expect(isStormy).toHaveBeenCalledTimes(2);
    }, { timeout: 15000 });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(`Plane ${planeId} has taken off`, expect.anything());
    }, { timeout: 15000 });

    await waitFor(() => {
      const planeItems = screen.queryAllByTestId('plane-item');
      expect(planeItems).toHaveLength(0);
    }, { timeout: 15000 });
  });

  it('prevents takeoff when weather is stormy', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    await act(async () => {
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });

    (isStormy as jest.Mock).mockReturnValue(true);

    const takeoffButton = await screen.findByTestId('takeoff-container');
    await act(async () => {
      await userEvent.click(takeoffButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, unable to take off!');
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    });

    expect(isStormy).toHaveBeenCalled();
  });

  it('prevents takeoff when no planes are available', async () => {
    const takeoffButton = await screen.findByTestId('takeoff-container');
    await userEvent.click(takeoffButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No planes available for takeoff.');
    });
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
        await userEvent.clear(planeIdInput);
        await userEvent.type(planeIdInput, planeId);
        await userEvent.click(landButton);
      });

      await waitFor(() => {
        const hangerCount = screen.getByTestId('hanger-count');
        expect(hangerCount).toHaveTextContent(`Planes in hanger: ${i + 1}`);
      }, { timeout: 10000 });
    }

    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 3');
      const planeItems = screen.getAllByTestId('plane-item');
      expect(planeItems).toHaveLength(3);
      planeItems.forEach((item, index) => {
        expect(item).toHaveTextContent(`plane-${index + 1}`);
      });
    }, { timeout: 10000 });
  });

  it('handles multiple planes taking off', async () => {
    await act(async () => {
      await landMultiplePlanes(3);
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 3');
    }, { timeout: 10000 });

    await act(async () => {
      await takeOffMultiplePlanes(2);
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 10000 });

    const planeItems = await screen.findAllByTestId('plane-item');
    expect(planeItems).toHaveLength(1);
  });

  it('verifies plane IDs in the hangar after multiple operations', async () => {
    await act(async () => {
      await landMultiplePlanes(3);
    });
    await act(async () => {
      await takeOffMultiplePlanes(2);
    });
    await act(async () => {
      await landMultiplePlanes(2);
    });

    await waitFor(() => {
      const hangarPlanes = screen.getAllByTestId('plane-item');
      expect(hangarPlanes).toHaveLength(3);
      const planeIds = hangarPlanes.map(plane => plane.textContent);
      expect(planeIds).toEqual(['plane-3', 'plane-4', 'plane-5']);
    }, { timeout: 10000 });
  });

  it('displays appropriate error message when weather turns stormy during landing', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    // Land the first plane
    await act(async () => {
      await userEvent.type(planeIdInput, 'plane-1');
      await userEvent.click(landButton);
    });
    await waitFor(() => expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1'), { timeout: 5000 });

    // Mock stormy weather
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to land another plane
    await act(async () => {
      await userEvent.clear(planeIdInput);
      await userEvent.type(planeIdInput, 'plane-2');
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, cannot land the plane!', expect.anything());
    }, { timeout: 5000 });

    await waitFor(() => {
      // Verify that the hangar count remains unchanged
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');

      // Verify that only the first plane is in the hangar
      const hangarPlanes = screen.getAllByTestId('plane-item');
      expect(hangarPlanes).toHaveLength(1);
      expect(hangarPlanes[0].textContent).toBe('plane-1');
    }, { timeout: 5000 });
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    await act(async () => {
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 5000 });

    (isStormy as jest.Mock).mockReturnValue(true);
    const takeoffButton = await screen.findByTestId('takeoff-container');
    await act(async () => {
      await userEvent.click(takeoffButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, unable to take off!');
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 10000 });
  });

  it('ensures state persistence across different actions', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = await screen.findByTestId('takeoff-container');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    await waitFor(() => {
      expect(planeIdInput).toBeInTheDocument();
    }, { timeout: 5000 });

    await act(async () => {
      await userEvent.type(planeIdInput, 'test-plane');
      await waitFor(() => expect(planeIdInput).toHaveValue('test-plane'), { timeout: 5000 });
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 15000 });

    await act(async () => {
      await userEvent.click(takeOffButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: 15000 });

    await act(async () => {
      await userEvent.clear(planeIdInput);
      await waitFor(() => expect(planeIdInput).toHaveValue(''), { timeout: 5000 });

      await userEvent.type(planeIdInput, 'another-plane');
      await waitFor(() => expect(planeIdInput).toHaveValue('another-plane'), { timeout: 5000 });

      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 15000 });
  });

  it('verifies that isStormy mock function is called during landing and takeoff', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = await screen.findByTestId('takeoff-container');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    await act(async () => {
      await userEvent.type(planeIdInput, 'test-plane');
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(isStormy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 5000 });

    expect(toast.success).toHaveBeenCalledWith('Plane test-plane has landed', expect.anything());

    await act(async () => {
      await userEvent.click(takeOffButton);
    });

    await waitFor(() => {
      expect(isStormy).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: 5000 });

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('has taken off'), expect.anything());
  });
});