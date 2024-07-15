import React from 'react';
import { render, screen, waitFor, within, act, getByTestId } from '@testing-library/react';
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

jest.mock('../Plane/Plane', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(function (this: MockPlaneInstance, id: string) {
    this.id = id || '_' + Math.random().toString(36).substr(2, 9);
    this.airborn = false;
    this.landed = jest.fn().mockReturnThis();
    this.inTheAir = jest.fn().mockReturnThis();
    return this;
  }),
  instances: [] as MockPlaneInstance[],
}));

jest.mock('../Weather/Weather', () => ({
  isStormy: jest.fn(),
}));

const TIMEOUT = 10000; // Reduced timeout to 10 seconds


const landMultiplePlanes = async (count: number) => {
  const landButton = screen.getByTestId('land-plane-button');
  const planeIdInput = screen.getByTestId('plane-id-input');

  for (let i = 0; i < count; i++) {
    const planeId = `plane-${i + 1}`;
    await act(async () => {
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
    });
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${i + 1}`);
    }, { timeout: TIMEOUT });
  }
};

const takeOffMultiplePlanes = async (count: number) => {
  const takeOffButton = screen.getByTestId('take-off-button');

  for (let i = 0; i < count; i++) {
    await act(async () => {
      await userEvent.click(takeOffButton);
    });
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
    render(<Airport PlaneClass={MockPlane} />);
  });

  it('renders Airport component', () => {
    render(<Airport PlaneClass={MockPlane} />);
    expect(screen.getByTestId('airport-heading')).toBeInTheDocument();
    expect(screen.getByTestId('airport-capacity')).toBeInTheDocument();
    expect(screen.getByTestId('hanger-count')).toBeInTheDocument();
  });

  it('lands a plane successfully', async () => {
    const landButton = screen.getByTestId('land-plane-button');
    const planeIdInput = screen.getByTestId('plane-id-input');
    const planeId = 'test-plane-1';

    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when hanger is full', async () => {
    await landMultiplePlanes(5);
    await userEvent.click(screen.getByTestId('land-plane-button'));

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 5');
      expect(screen.getByTestId('error-message')).toHaveTextContent('Hanger full, abort landing!');
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByTestId('land-plane-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Stormy weather, cannot land the plane!');
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when plane is already in hanger', async () => {
    const landButton = screen.getByTestId('land-plane-button');
    const planeIdInput = screen.getByTestId('plane-id-input');
    const planeId = 'test-plane-id';

    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('That plane is already here');
    }, { timeout: TIMEOUT });
  });

  it('takes off a plane successfully', async () => {
    await userEvent.click(screen.getByTestId('land-plane-button'));
    await userEvent.click(screen.getByTestId('take-off-button'));

    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when weather is stormy', async () => {
    await userEvent.click(screen.getByTestId('land-plane-button'));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByTestId('take-off-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Stormy weather, unable to take off!');
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when no planes are available', async () => {
    await userEvent.click(screen.getByTestId('take-off-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('No planes available for takeoff.');
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    const landButton = screen.getByTestId('land-plane-button');
    const takeOffButton = screen.getByTestId('take-off-button');

    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    await userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });

    await userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('No planes available for takeoff.');
    }, { timeout: TIMEOUT });
  });

  it('handles multiple planes landing', async () => {
    const landButton = screen.getByTestId('land-plane-button');
    const planeIdInput = screen.getByTestId('plane-id-input');

    for (let i = 0; i < 3; i++) {
      const planeId = `plane-${i + 1}`;
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);

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

    await waitFor(() => {
      const hangarPlanes = screen.getAllByTestId('plane-item');
      expect(hangarPlanes).toHaveLength(3);
      expect(hangarPlanes.map(plane => plane.textContent)).toEqual(['plane-1', 'plane-4', 'plane-5']);
    }, { timeout: TIMEOUT });
  });

  it('displays appropriate error message when weather turns stormy during landing', async () => {
    const landButton = screen.getByTestId('land-plane-button');

    await userEvent.click(landButton);
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(landButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Stormy weather, cannot land the plane!');
    }, { timeout: TIMEOUT });
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    await userEvent.click(screen.getByTestId('land-plane-button'));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByTestId('take-off-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Stormy weather, unable to take off!');
    }, { timeout: TIMEOUT });
  });

  it('ensures state persistence across different actions', async () => {
    const landButton = screen.getByTestId('land-plane-button');
    const takeOffButton = screen.getByTestId('take-off-button');

    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    await userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });

    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });
  });

  it('verifies that isStormy mock function is called during landing and takeoff', async () => {
    const landButton = screen.getByTestId('land-plane-button');
    const takeOffButton = screen.getByTestId('take-off-button');

    await userEvent.click(landButton);
    await waitFor(() => expect(isStormy).toHaveBeenCalled(), { timeout: TIMEOUT });

    (isStormy as jest.Mock).mockClear();

    await userEvent.click(takeOffButton);
    await waitFor(() => expect(isStormy).toHaveBeenCalled(), { timeout: TIMEOUT });
  });
});