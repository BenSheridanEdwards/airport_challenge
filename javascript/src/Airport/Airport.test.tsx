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
    console.log('Starting beforeEach setup');
    jest.resetAllMocks();
    jest.restoreAllMocks();
    (isStormy as jest.Mock).mockReturnValue(false);
    console.log('isStormy mock set to:', (isStormy as jest.Mock).mock);
    jest.requireMock('../Plane/Plane').instances.length = 0;
    document.body.innerHTML = '';
    console.log('Rendering Airport component');
    render(<Airport PlaneClass={MockPlane} />);
    await waitFor(() => {
      expect(screen.getByTestId('airport-heading')).toBeInTheDocument();
    });
    console.log('Airport component rendered successfully');
    console.log('Initial render:');
    screen.debug();
    console.log('beforeEach setup completed');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders Airport component', async () => {
    console.log('Starting "renders Airport component" test');
    console.log('Rendered Airport component:');
    screen.debug();

    console.log('Checking for airport-heading');
    const airportHeading = await screen.findByTestId('airport-heading');
    console.log('airport-heading found:', airportHeading.textContent);
    expect(airportHeading).toBeInTheDocument();

    console.log('Checking for airport-capacity');
    const airportCapacity = await screen.findByTestId('airport-capacity');
    console.log('airport-capacity found:', airportCapacity.textContent);
    expect(airportCapacity).toBeInTheDocument();

    console.log('Checking for hanger-count');
    const hangerCount = await screen.findByTestId('hanger-count');
    console.log('hanger-count found:', hangerCount.textContent);
    expect(hangerCount).toBeInTheDocument();

    console.log('Completed "renders Airport component" test');
  });

  it('lands a plane successfully', async () => {
    console.log('Starting land plane test');
    const landButton = await screen.findByTestId('land-plane-button');
    console.log('Land button found:', landButton);
    const planeIdInput = await screen.findByTestId('land-plane-input');
    console.log('Plane ID input found:', planeIdInput);
    const planeId = 'test-plane-1';

    console.log('Before landing plane');
    await userEvent.type(planeIdInput, planeId);
    console.log('Plane ID entered:', planeId);
    await userEvent.click(landButton);
    console.log('Land button clicked');

    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      console.log('Current hanger count:', hangerCount.textContent);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    });
    console.log('Plane landed successfully');
    console.log('Final DOM state:');
    screen.debug();
  });

  it('prevents landing when hanger is full', async () => {
    console.log('Starting test: prevents landing when hanger is full');
    console.log('Landing 5 planes to fill the hanger');
    await landMultiplePlanes(5);

    console.log('Attempting to land one more plane');
    const landButton = await screen.findByTestId('land-plane-button');
    await userEvent.click(landButton);

    await waitFor(() => {
      console.log('Checking hanger count and error message');
      const hangerCount = screen.getByTestId('hanger-count');
      console.log('Current hanger count:', hangerCount.textContent);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 5');
      expect(toast.error).toHaveBeenCalledWith('Hanger full, abort landing!');
    });
    console.log('Test completed: prevents landing when hanger is full');
  });

  it('prevents landing when weather is stormy', async () => {
    console.log('Starting "prevents landing when weather is stormy" test');
    console.log('Setting isStormy mock to return true');
    (isStormy as jest.Mock).mockReturnValue(true);

    console.log('Finding land-plane-button');
    const landButton = await screen.findByTestId('land-plane-button');
    console.log('Clicking land-plane-button');
    await userEvent.click(landButton);

    console.log('Waiting for error toast');
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, cannot land the plane!');
    });
    console.log('Error toast verified');

    console.log('Checking hanger count');
    const hangerCount = await screen.findByTestId('hanger-count');
    expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    console.log('Hanger count verified as 0');

    console.log('Test "prevents landing when weather is stormy" completed');
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
    console.log('Starting take off plane test');
    const landButton = await screen.findByTestId('land-plane-button');
    const takeoffButton = await screen.findByTestId('takeoff-container');

    console.log('Before landing plane');
    await userEvent.click(landButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      console.log('Hanger count after landing:', hangerCount.textContent);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    });

    console.log('Before taking off plane');
    await userEvent.click(takeoffButton);

    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      console.log('Hanger count after takeoff:', hangerCount.textContent);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    });

    console.log('After takeoff:');
    screen.debug();
    console.log('Take off plane test completed');
  });

  it('prevents takeoff when weather is stormy', async () => {
    console.log('Starting "prevents takeoff when weather is stormy" test');

    const landButton = await screen.findByTestId('land-plane-button');
    console.log('Landing a plane before testing takeoff');
    await userEvent.click(landButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      console.log('Hanger count after landing:', hangerCount.textContent);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    });

    console.log('Setting stormy weather');
    (isStormy as jest.Mock).mockReturnValue(true);
    console.log('isStormy mock value:', (isStormy as jest.Mock).mock.results[0].value);

    const takeoffButton = await screen.findByTestId('takeoff-container');
    console.log('Attempting takeoff in stormy weather');
    await userEvent.click(takeoffButton);

    await waitFor(() => {
      console.log('Checking if error toast was called');
      expect(toast.error).toHaveBeenCalledWith('Stormy weather, unable to take off!');
    });

    const finalHangerCount = screen.getByTestId('hanger-count');
    console.log('Final hanger count:', finalHangerCount.textContent);
    expect(finalHangerCount).toHaveTextContent('Planes in hanger: 1');

    console.log('Test "prevents takeoff when weather is stormy" completed');
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
    console.log('Starting isStormy mock function test');
    const landButton = await screen.findByTestId('land-plane-button');
    const takeOffButton = await screen.findByTestId('takeoff-container');
    const planeIdInput = await screen.findByTestId('land-plane-input');

    console.log('Before landing plane');
    await userEvent.type(planeIdInput, 'test-plane');
    await userEvent.click(landButton);

    await waitFor(() => {
      console.log('isStormy calls during landing:', (isStormy as jest.Mock).mock.calls.length);
      expect(isStormy).toHaveBeenCalled();
      const hangerCount = screen.getByTestId('hanger-count');
      console.log('Hanger count after landing:', hangerCount.textContent);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    });

    console.log('Clearing mocks before takeoff');
    jest.clearAllMocks();

    console.log('Before taking off plane');
    await userEvent.click(takeOffButton);

    await waitFor(() => {
      console.log('isStormy calls during takeoff:', (isStormy as jest.Mock).mock.calls.length);
      expect(isStormy).toHaveBeenCalled();
      const hangerCount = screen.getByTestId('hanger-count');
      console.log('Hanger count after takeoff:', hangerCount.textContent);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    });

    console.log('Completed isStormy mock function test');
  });
});