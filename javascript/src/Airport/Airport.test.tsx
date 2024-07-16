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
    await screen.findByText(`Planes in hanger: ${i + 1}`);
  }
};

const takeOffMultiplePlanes = async (count: number) => {
  const takeOffButton = screen.getByTestId('takeoff-container');

  for (let i = 0; i < count; i++) {
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      const expectedCount = count - i - 1;
      expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${expectedCount}`);
    }, { timeout: TIMEOUT });
  }
};

describe('Airport Component', () => {
  const MockPlane = jest.requireActual('../Plane/Plane').default;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    (isStormy as jest.Mock).mockReturnValue(false);
    jest.requireMock('../Plane/Plane').instances.length = 0;
    document.body.innerHTML = '';
    jest.useFakeTimers();
    render(<Airport PlaneClass={MockPlane} />);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders Airport component', () => {
    expect(screen.getByTestId('airport-heading')).toBeInTheDocument();
    expect(screen.getByTestId('airport-capacity')).toBeInTheDocument();
    expect(screen.getByTestId('hanger-count')).toBeInTheDocument();
  });

  it('lands a plane successfully', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    screen.debug(); // Use screen.debug() to log the rendered component structure

    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');
    const planeId = 'test-plane-1';

    await act(async () => {
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when hanger is full', async () => {
    await landMultiplePlanes(5);
    const landButton = await screen.findByTestId('land-plane-button');
    await act(async () => {
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 5');
      expect(toast.error).toHaveBeenCalledWith('Hanger full, abort landing!');
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    const landButton = await screen.findByTestId('land-plane-button');
    await act(async () => {
      await userEvent.click(landButton);
    });

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
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    await act(async () => {
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('That plane is already here');
    }, { timeout: TIMEOUT });
  });

  it('takes off a plane successfully', async () => {
    await act(async () => {
      await userEvent.click(await screen.findByTestId('land-plane-button'));
      await userEvent.click(await screen.findByTestId('takeoff-container'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when weather is stormy', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    await act(async () => {
      await userEvent.click(landButton);
    });
    (isStormy as jest.Mock).mockReturnValue(true);
    await act(async () => {
      await userEvent.click(screen.getByTestId('takeoff-container'));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, unable to take off!');
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when no planes are available', async () => {
    await act(async () => {
      await userEvent.click(screen.getByTestId('takeoff-container'));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No planes available for takeoff.');
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = screen.getByTestId('takeoff-container');

    await act(async () => {
      await userEvent.click(landButton);
    });
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    await act(async () => {
      await userEvent.click(takeOffButton);
    });
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });

    await act(async () => {
      await userEvent.click(takeOffButton);
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
      });

      await waitFor(() => {
        expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${i + 1}`);
      }, { timeout: TIMEOUT });
    }
  });

  it('handles multiple planes taking off', async () => {
    await landMultiplePlanes(3);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 3');
    }, { timeout: TIMEOUT });

    await takeOffMultiplePlanes(2);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });
  });

  it('verifies plane IDs in the hangar after multiple operations', async () => {
    await landMultiplePlanes(3);
    await takeOffMultiplePlanes(2);
    await landMultiplePlanes(2);

    const hangarPlanes = await screen.findAllByTestId('plane-item');
    expect(hangarPlanes).toHaveLength(3);
    expect(hangarPlanes.map(plane => plane.textContent)).toEqual(['plane-1', 'plane-4', 'plane-5']);
  });

  it('displays appropriate error message when weather turns stormy during landing', async () => {
    const landButton = await screen.findByTestId('land-plane-button');

    await act(async () => {
      await userEvent.click(landButton);
    });
    (isStormy as jest.Mock).mockReturnValue(true);
    await act(async () => {
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, cannot land the plane!');
    }, { timeout: TIMEOUT });
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    await act(async () => {
      await userEvent.click(landButton);
    });
    (isStormy as jest.Mock).mockReturnValue(true);
    await act(async () => {
      await userEvent.click(screen.getByTestId('takeoff-container'));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, unable to take off!');
    }, { timeout: TIMEOUT });
  });

  it('ensures state persistence across different actions', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = screen.getByTestId('takeoff-container');

    await act(async () => {
      await userEvent.click(landButton);
    });
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    await act(async () => {
      await userEvent.click(takeOffButton);
    });
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });

    await act(async () => {
      await userEvent.click(landButton);
    });
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });
  });

  it('verifies that isStormy mock function is called during landing and takeoff', async () => {
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = screen.getByTestId('takeoff-container');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    await act(async () => {
      await userEvent.type(planeIdInput, 'test-plane');
      await userEvent.click(landButton);
    });

    await waitFor(() => expect(isStormy).toHaveBeenCalled(), { timeout: TIMEOUT });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    jest.clearAllMocks();

    await act(async () => {
      await userEvent.click(takeOffButton);
    });

    await waitFor(() => expect(isStormy).toHaveBeenCalled(), { timeout: TIMEOUT });

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });
  });
});