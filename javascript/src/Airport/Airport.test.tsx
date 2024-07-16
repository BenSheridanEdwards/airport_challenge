import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';
import { toast } from 'react-toastify';

console.log('Starting Airport Component tests - Improved error handling and enhanced logging');
// Removed global timeout increase to avoid masking underlying issues

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
  isStormy: jest.fn().mockReturnValue(false),
}));

// Removed TIMEOUT constant

const landMultiplePlanes = async (count: number) => {
  console.log(`Starting to land ${count} planes`);
  const landButton = await screen.findByTestId('land-plane-button');
  const planeIdInput = await screen.findByTestId('land-plane-input');

  for (let i = 0; i < count; i++) {
    console.log(`Landing plane ${i + 1} of ${count}`);
    const planeId = `plane-${i + 1}`;
    await userEvent.clear(planeIdInput);
    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);
    await waitFor(() => {
      console.log(`Checking hanger count for plane ${i + 1}`);
      expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${i + 1}`);
    }, { timeout: 3000 });
    await waitFor(() => {
      console.log(`Checking if input is cleared after landing plane ${i + 1}`);
      expect(screen.getByTestId('land-plane-input')).toHaveValue('');
    }, { timeout: 3000 });
  }
  console.log(`Finished landing ${count} planes`);
};

const takeOffMultiplePlanes = async (count: number) => {
  console.log(`Starting takeOffMultiplePlanes with count: ${count}`);
  const takeOffButton = await screen.findByTestId('takeoff-container');

  for (let i = 0; i < count; i++) {
    console.log(`Attempting to take off plane ${i + 1} of ${count}`);
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      const expectedCount = count - i - 1;
      console.log(`Checking hanger count. Expected: ${expectedCount}`);
      expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${expectedCount}`);
    }, { timeout: 3000 });
    console.log(`Plane ${i + 1} took off successfully`);
  }
  console.log(`Completed takeOffMultiplePlanes. Final count: ${count - count}`);
};

describe('Airport Component', () => {
  const MockPlane = jest.requireActual('../Plane/Plane').default;

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();
    (isStormy as jest.Mock).mockClear();
    (isStormy as jest.Mock).mockImplementation(() => false);
    jest.requireMock('../Plane/Plane').instances.length = 0;
    document.body.innerHTML = '';

    await act(async () => {
      render(<Airport PlaneClass={MockPlane} />);
    });

    await screen.findByTestId('airport-heading', {}, { timeout: 5000 });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders Airport component', async () => {
    console.log('Starting test: renders Airport component');

    const airportHeading = await screen.findByTestId('airport-heading');
    console.log('Checking airport heading');
    expect(airportHeading).toBeInTheDocument();

    const airportCapacity = await screen.findByTestId('airport-capacity');
    console.log('Checking airport capacity');
    expect(airportCapacity).toBeInTheDocument();

    const hangerCount = await screen.findByTestId('hanger-count');
    console.log('Checking hanger count');
    expect(hangerCount).toBeInTheDocument();

    console.log('Completed test: renders Airport component');
  });

  it.only('lands a plane successfully', async () => {
    console.log('Starting test: lands a plane successfully');

    console.log('Finding land button');
    const landButton = await screen.findByTestId('land-plane-button', {}, { timeout: 5000 });
    console.log('Land button found');

    console.log('Finding plane ID input');
    const planeIdInput = await screen.findByTestId('land-plane-input', {}, { timeout: 5000 });
    console.log('Plane ID input found');

    const planeId = 'test-plane-1';
    console.log(`Typing plane ID: ${planeId}`);
    await userEvent.type(planeIdInput, planeId);
    console.log('Plane ID typed');

    console.log('Checking if land button is enabled');
    await waitFor(() => {
      expect(landButton).toBeEnabled();
    }, { timeout: 5000 });
    console.log('Land button is enabled');

    console.log('Clicking land button');
    await userEvent.click(landButton);
    console.log('Land button clicked');

    console.log('Waiting for hanger count update');
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      console.log(`Current hanger count: ${hangerCount.textContent}`);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 5000 });
    console.log('Hanger count updated successfully');

    console.log('Test completed: lands a plane successfully');
  });

  it('prevents landing when hanger is full', async () => {
    console.log('Starting test: prevents landing when hanger is full');
    await act(async () => {
      await landMultiplePlanes(5);
    });

    console.log('Attempting to land plane when hanger is full');
    const landButton = await screen.findByTestId('land-plane-button');
    await userEvent.click(landButton);

    await waitFor(() => {
      console.log('Checking hanger count and error message');
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 5');
      expect(toast.error).toHaveBeenCalledWith('Hanger full, abort landing!');
    }, { timeout: 5000 });

    expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 5');
    expect(screen.getByTestId('hanger-count').textContent).toBe('Planes in hanger: 5');
    expect(toast.error).toHaveBeenCalledWith('Hanger full, abort landing!');
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Hanger full, abort landing!');

    console.log('Verifying isStormy was called');
    expect(isStormy).toHaveBeenCalled();
    console.log('Test completed: prevents landing when hanger is full');
  }, 10000);

  it('prevents landing when weather is stormy', async () => {
    console.log('Starting test: prevents landing when weather is stormy');
    (isStormy as jest.Mock).mockReturnValue(true);

    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    console.log('Attempting to land plane in stormy weather');
    await act(async () => {
      await userEvent.type(planeIdInput, 'test-plane');
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      console.log('Checking if isStormy was called and error toast was shown');
      expect(isStormy).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, cannot land the plane!');
    }, { timeout: 3000 });

    await waitFor(() => {
      console.log('Verifying hanger count remains unchanged');
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: 3000 });

    console.log('Test completed: prevents landing when weather is stormy');
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
    }, { timeout: 3000 });

    await act(async () => {
      await userEvent.clear(planeIdInput);
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('That plane is already here');
    }, { timeout: 3000 });

    expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
  });

  it('takes off a plane successfully', async () => {
    console.log('Starting test: takes off a plane successfully');
    const landButton = await screen.findByTestId('land-plane-button');
    const takeoffButton = await screen.findByTestId('takeoff-container');
    const planeId = 'test-plane-1';

    console.log('Attempting to land plane');
    await act(async () => {
      await userEvent.type(screen.getByTestId('land-plane-input'), planeId);
      await userEvent.click(landButton);
    });
    console.log('Plane landing operation completed');

    await waitFor(() => {
      console.log('Checking hanger count after landing');
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 3000 });

    console.log('Attempting to take off plane');
    await act(async () => {
      await userEvent.click(takeoffButton);
    });
    console.log('Plane takeoff operation completed');

    await waitFor(() => {
      console.log('Checking hanger count after takeoff');
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: 3000 });

    await waitFor(() => {
      console.log('Checking isStormy call count');
      expect(isStormy).toHaveBeenCalledTimes(2);
    }, { timeout: 3000 });

    await waitFor(() => {
      console.log('Checking toast success message');
      expect(toast.success).toHaveBeenCalledWith(`Plane ${planeId} has taken off`, expect.anything());
    }, { timeout: 3000 });

    await waitFor(() => {
      console.log('Checking plane items in hanger');
      const planeItems = screen.queryAllByTestId('plane-item');
      expect(planeItems).toHaveLength(0);
    }, { timeout: 3000 });

    console.log('Test completed: takes off a plane successfully');
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
    console.log('Starting test: handles multiple planes landing');
    const landButton = await screen.findByTestId('land-plane-button');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    for (let i = 0; i < 3; i++) {
      const planeId = `plane-${i + 1}`;
      console.log(`Attempting to land plane: ${planeId}`);
      await act(async () => {
        await userEvent.clear(planeIdInput);
        await userEvent.type(planeIdInput, planeId);
        await userEvent.click(landButton);
      });

      await waitFor(() => {
        console.log(`Checking hanger count for plane: ${planeId}`);
        const hangerCount = screen.getByTestId('hanger-count');
        expect(hangerCount).toHaveTextContent(`Planes in hanger: ${i + 1}`);
      }, { timeout: 3000 });
    }

    await waitFor(() => {
      console.log('Verifying final hanger state');
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 3');
      const planeItems = screen.getAllByTestId('plane-item');
      expect(planeItems).toHaveLength(3);
      planeItems.forEach((item, index) => {
        expect(item).toHaveTextContent(`plane-${index + 1}`);
      });
    }, { timeout: 3000 });
    console.log('Test completed: handles multiple planes landing');
  });

  it('handles multiple planes taking off', async () => {
    console.log('Starting test: handles multiple planes taking off');

    await act(async () => {
      console.log('Landing multiple planes');
      await landMultiplePlanes(3);
    });

    await waitFor(() => {
      console.log('Checking hanger count after landing');
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 3');
    }, { timeout: 3000 });

    await act(async () => {
      console.log('Taking off multiple planes');
      await takeOffMultiplePlanes(2);
    });

    await waitFor(() => {
      console.log('Checking hanger count after takeoff');
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: 3000 });

    console.log('Verifying remaining planes');
    const planeItems = await screen.findAllByTestId('plane-item');
    expect(planeItems).toHaveLength(1);

    console.log('Test completed: handles multiple planes taking off');
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
    }, { timeout: 5000 });
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
    console.log('Starting test: verifies isStormy calls during landing and takeoff');

    await act(async () => {
      render(<Airport PlaneClass={MockPlane} />);
    });

    const landButton = await screen.findByTestId('land-plane-button', {}, { timeout: 10000 });
    const takeOffButton = await screen.findByTestId('takeoff-container', {}, { timeout: 10000 });
    const planeIdInput = await screen.findByTestId('land-plane-input', {}, { timeout: 10000 });

    const validPlaneId = 'test-plane';
    await act(async () => {
      await userEvent.type(planeIdInput, validPlaneId);
    });

    console.log('Attempting to land plane');
    await act(async () => {
      await userEvent.click(landButton);
    });

    await waitFor(() => {
      expect(isStormy).toHaveBeenCalledTimes(1);
      const hangerCount = screen.getByTestId('hanger-count');
      console.log('Hanger count after landing:', hangerCount.textContent);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
      expect(toast.success).toHaveBeenCalledWith(`Plane ${validPlaneId} has landed`, expect.anything());
    }, { timeout: 10000 });

    console.log('Attempting takeoff');
    await act(async () => {
      await userEvent.click(takeOffButton);
    });

    await waitFor(() => {
      expect(isStormy).toHaveBeenCalledTimes(2);
      const hangerCount = screen.getByTestId('hanger-count');
      console.log('Hanger count after takeoff:', hangerCount.textContent);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('has taken off'), expect.anything());
    }, { timeout: 10000 });

    console.log('Test completed: verifies isStormy calls during landing and takeoff');
  });
});