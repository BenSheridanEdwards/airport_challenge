import React from 'react';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';

// Set global timeout for all tests
jest.setTimeout(30000); // 30 seconds

interface MockPlaneInstance {
  id: string;
  airborn: boolean;
  landed: jest.Mock;
  inTheAir: jest.Mock;
}

jest.mock('../Plane/Plane', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(function (this: MockPlaneInstance, id: string) {
      this.id = id || '_' + Math.random().toString(36).substr(2, 9);
      this.airborn = false;
      this.landed = jest.fn().mockReturnThis();
      this.inTheAir = jest.fn().mockReturnThis();
      return this;
    }),
    instances: [] as MockPlaneInstance[],
  };
});

jest.mock('../Weather/Weather', () => ({
  isStormy: jest.fn(),
}));

const TIMEOUT = 15000; // Increased timeout to 15 seconds



const landMultiplePlanes = async (count: number) => {
  console.log(`Starting to land ${count} planes`);
  const landButton = screen.getByRole('button', { name: /land plane/i });
  const planeIdInput = screen.getByTestId('plane-id-input');

  const landPlane = async (i: number) => {
    const planeId = `plane-${i + 1}`;
    console.log(`Attempting to land plane ${planeId}`);
    try {
      await act(async () => {
        console.log(`Land button disabled state before typing: ${(landButton as HTMLButtonElement).disabled}`);
        await userEvent.type(planeIdInput, planeId);
        console.log(`Land button disabled state after typing: ${(landButton as HTMLButtonElement).disabled}`);
        console.log(`Plane ID input value: ${(planeIdInput as HTMLInputElement).value}`);
        await userEvent.click(landButton);
      });
      await waitFor(() => {
        const hangerCount = screen.getByTestId('hanger-count').textContent;
        console.log(`Current hanger count: ${hangerCount}`);
        expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${i + 1}`);
      }, { timeout: TIMEOUT });
      console.log(`Successfully landed plane ${planeId}`);
    } catch (error) {
      console.error(`Error landing plane ${planeId}:`, error);
      throw error;
    }
  };

  try {
    await Promise.all(Array.from({ length: count }, (_, i) => landPlane(i)));
    console.log(`Finished landing ${count} planes`);
  } catch (error) {
    console.error('Error in landMultiplePlanes:', error);
    throw error;
  }
};

const takeOffMultiplePlanes = async (count: number) => {
  console.log(`Starting takeOffMultiplePlanes for ${count} planes`);
  const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
  const takeOffPromises = Array.from({ length: count }, async (_, i) => {
    try {
      console.log(`Attempting to take off plane ${i + 1}`);
      await act(async () => {
        await userEvent.click(takeOffButton);
      });
      await waitFor(() => {
        const expectedCount = count - i - 1;
        console.log(`Checking hanger count: expected ${expectedCount}`);
        expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${expectedCount}`);
      }, { timeout: TIMEOUT });
      console.log(`Plane ${i + 1} took off successfully`);
    } catch (error) {
      console.error(`Error taking off plane ${i + 1}:`, error);
      throw error;
    }
  });
  try {
    await Promise.all(takeOffPromises);
    console.log(`Completed takeOffMultiplePlanes for ${count} planes`);
  } catch (error) {
    console.error('Error in takeOffMultiplePlanes:', error);
    throw error;
  }
};

describe('Airport Component', () => {
  const MockPlane = jest.requireActual('../Plane/Plane').default;

  beforeEach(() => {
    console.log('Setting up test environment');
    jest.resetAllMocks();
    jest.restoreAllMocks();
    (isStormy as jest.Mock).mockReturnValue(false);
    console.log('isStormy mock set to:', (isStormy as jest.Mock)());
    try {
      jest.requireMock('../Plane/Plane').instances.length = 0;
      console.log('Cleared Plane instances');
    } catch (error) {
      console.error('Error clearing Plane instances:', error);
    }
    document.body.innerHTML = '';
    console.log('Cleared toast notifications');
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i }) as HTMLButtonElement;
    console.log('Initial render - Land button disabled state:', landButton.disabled);
    console.log('Test environment setup complete');
  });

  it('renders Airport component', () => {
    console.log('Starting test: renders Airport component');
    try {
      render(<Airport PlaneClass={MockPlane} />);
      expect(screen.getByTestId('airport-heading')).toBeInTheDocument();
      expect(screen.getByTestId('airport-capacity')).toBeInTheDocument();
      expect(screen.getByTestId('hanger-count')).toBeInTheDocument();
      console.log('Completed test: renders Airport component');
    } catch (error) {
      console.error('Error in test renders Airport component:', error);
      throw error;
    }
  });

  it('lands a plane successfully', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByTestId('land-plane-button') as HTMLButtonElement;
    await userEvent.click(landButton);

    const planeIdInput = screen.getByTestId('plane-id-input') as HTMLInputElement;
    const planeId = 'test-plane-1';
    await userEvent.type(planeIdInput, planeId);

    try {
      await waitFor(() => {
        const hangerCount = screen.getByTestId('hanger-count');
        expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
      }, { timeout: TIMEOUT });
    } catch (error) {
      console.error('Error in land plane test:', error);
      throw error;
    }
  });

  it('prevents landing when hanger is full', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await landMultiplePlanes(5);
    await userEvent.click(screen.getByTestId('land-plane-button'));

    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 5');
    }, { timeout: TIMEOUT });

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveTextContent('Hanger full, abort landing!');
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByTestId('land-plane-button'));
    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveTextContent('Stormy weather, cannot land the plane!');
    }, { timeout: TIMEOUT }).catch(error => {
      console.error('Timeout waiting for stormy weather message:', error);
      throw error;
    });
  });

  it('prevents landing when plane is already in hanger', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByTestId('land-plane-button');
    const planeIdInput = screen.getByTestId('plane-id-input');

    const planeId = 'test-plane-id';
    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);

    await waitFor(() => {
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(within(hangerContainer).getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveTextContent('That plane is already here');
    }, { timeout: TIMEOUT });
  });

  it('takes off a plane successfully', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByTestId('land-plane-button'));
    await userEvent.click(screen.getByTestId('take-off-button'));
    await waitFor(() => {
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(within(hangerContainer).getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when weather is stormy', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByTestId('land-plane-button'));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByTestId('take-off-button'));
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Stormy weather, unable to take off!');
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when no planes are available', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByTestId('take-off-button'));
    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveTextContent('No planes available for takeoff.');
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);

    const landButton = screen.getByTestId('land-plane-button');
    const takeOffButton = screen.getByTestId('take-off-button');

    await userEvent.click(landButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    await userEvent.click(takeOffButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });

    await userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('No planes available for takeoff.');
    }, { timeout: TIMEOUT });
  });

  it('handles multiple planes landing', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);

    const landButton = screen.getByTestId('land-plane-button') as HTMLButtonElement;
    const planeIdInput = screen.getByTestId('plane-id-input') as HTMLInputElement;

    for (let i = 0; i < 3; i++) {
      const planeId = `plane-${i + 1}`;
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);

      await waitFor(() => {
        expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${i + 1}`);
      }, { timeout: TIMEOUT });
    }

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 3');
    }, { timeout: TIMEOUT });
  });

  it('handles multiple planes taking off', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);

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
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);

    await landMultiplePlanes(3);
    await takeOffMultiplePlanes(2);
    await landMultiplePlanes(2);

    await waitFor(() => {
      const hangarPlanes = screen.getAllByTestId('plane-item');
      expect(hangarPlanes).toHaveLength(3);
      expect(hangarPlanes.map(plane => plane.textContent)).toEqual(['plane-1', 'plane-4', 'plane-5']);
    }, { timeout: TIMEOUT });
  });

  it('displays appropriate error message when weather turns stormy during landing', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByTestId('land-plane-button');

    await userEvent.click(landButton);
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Stormy weather, cannot land the plane!');
    }, { timeout: TIMEOUT });
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByTestId('land-plane-button');

    await userEvent.click(landButton);
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByTestId('take-off-button'));
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Stormy weather, unable to take off!');
    }, { timeout: TIMEOUT });
  });

  it('ensures state persistence across different actions', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByTestId('land-plane-button');
    const takeOffButton = screen.getByTestId('take-off-button');

    await userEvent.click(landButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    await userEvent.click(takeOffButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });

    await userEvent.click(landButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });
  });

  it('verifies that isStormy mock function is called during landing and takeoff', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByTestId('land-plane-button');
    const takeOffButton = screen.getByTestId('take-off-button');

    await userEvent.click(landButton);
    await waitFor(() => expect(isStormy).toHaveBeenCalled(), { timeout: TIMEOUT });

    (isStormy as jest.Mock).mockClear();

    await userEvent.click(takeOffButton);
    await waitFor(() => expect(isStormy).toHaveBeenCalled(), { timeout: TIMEOUT });
  });
});