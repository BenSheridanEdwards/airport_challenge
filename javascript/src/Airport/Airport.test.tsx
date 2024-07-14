import React from 'react';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';

// Minor change to trigger Husky and workflow

interface MockPlaneInstance {
  id: string;
  airborn: boolean;
  landed: jest.Mock;
  inTheAir: jest.Mock;
}

jest.mock('../Plane/Plane', () => {
  const mockInstances: MockPlaneInstance[] = [];
  const mockPlane = jest.fn().mockImplementation(function (this: MockPlaneInstance, id: string) {
    this.id = id || '_' + Math.random().toString(36).substr(2, 9);
    this.airborn = false;
    this.landed = jest.fn().mockReturnThis();
    this.inTheAir = jest.fn().mockReturnThis();
    mockInstances.push(this);
    return this;
  });
  return {
    __esModule: true,
    default: mockPlane,
    get instances() { return mockInstances; },
  };
});

jest.mock('../Weather/Weather', () => ({
  isStormy: jest.fn(),
}));

const TIMEOUT = 20000; // Increase timeout to 20 seconds

const landMultiplePlanes = async (count: number) => {
  console.log(`Starting to land ${count} planes`);
  const landButton = screen.getByRole('button', { name: /land plane/i });
  const planeIdInput = screen.getByTestId('plane-id-input');
  for (let i = 0; i < count; i++) {
    const planeId = `plane-${i + 1}`;
    console.log(`Attempting to land plane: ${planeId}`);
    await act(async () => {
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
    });
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      console.log(`Current hanger count: ${hangerCount.textContent}`);
      expect(hangerCount).toHaveTextContent(`Planes in hanger: ${i + 1}`);
    }, { timeout: TIMEOUT });
    console.log(`Successfully landed plane: ${planeId}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Add small delay
  }
  console.log(`Finished landing ${count} planes`);
};

const takeOffMultiplePlanes = async (count: number) => {
  console.log(`Starting takeOffMultiplePlanes with count: ${count}`);
  const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
  for (let i = 0; i < count; i++) {
    console.log(`Attempting to take off plane ${i + 1}`);
    await act(async () => {
      await userEvent.click(takeOffButton);
    });
    console.log(`Clicked take off button for plane ${i + 1}`);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      console.log(`Current hanger count: ${hangerCount.textContent}`);
      expect(hangerCount).toHaveTextContent(`Planes in hanger: ${count - i - 1}`);
    }, { timeout: TIMEOUT });
    console.log(`Verified hanger count after plane ${i + 1} took off`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Add small delay
  }
  console.log(`Finished takeOffMultiplePlanes, ${count} planes took off`);
};

describe('Airport Component', () => {
  const MockPlane = jest.requireActual('../Plane/Plane').default;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    (isStormy as jest.Mock).mockReturnValue(false);
    jest.requireMock('../Plane/Plane').instances.length = 0; // Clear the instances array before each test
    document.body.innerHTML = ''; // Clear toast notifications
  });

  it('renders Airport component', () => {
    render(<Airport PlaneClass={MockPlane} />);
    expect(screen.getByText('Airport')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 5')).toBeInTheDocument();
    expect(screen.getByText('Planes in hanger: 0')).toBeInTheDocument();
  });

  it('lands a plane successfully', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when hanger is full', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await landMultiplePlanes(5);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 5');
    }, { timeout: TIMEOUT });
    await waitFor(() => {
      const errorMessage = screen.getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Hanger full, abort landing!'));
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await waitFor(() => {
      return screen.findByText('Stormy weather, cannot land the plane!').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: TIMEOUT });
  });

  it('prevents landing when plane is already in hanger', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const planeIdInput = screen.getByTestId('plane-id-input');

    // Enter the planeId and land the plane
    const planeId = 'test-plane-id';
    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);

    const hangerContainer = screen.getByTestId('hanger-container');
    await waitFor(() => {
      expect(within(hangerContainer).getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Planes in hanger: 1'))).toBeInTheDocument();
    }, { timeout: TIMEOUT });

    // Attempt to land the same plane again
    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);
    await waitFor(() => {
      return screen.findByText('That plane is already here').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: TIMEOUT });
  });

  it('takes off a plane successfully', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(() => {
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(within(hangerContainer).getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Planes in hanger: 0'))).toBeInTheDocument();
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when weather is stormy', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(() => {
      return screen.findByText('Stormy weather, unable to take off!').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when no planes are available', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(() => {
      return screen.findByText('No planes available for takeoff.').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: TIMEOUT });
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
    await userEvent.click(landButton);
    await waitFor(async () => {
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
      return screen.findByText('No planes available for takeoff.').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: TIMEOUT });
  });

  it('handles multiple planes landing', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);

    // Land 3 planes
    await waitFor(async () => {
      await landMultiplePlanes(3);
      expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 3');
    }, { timeout: TIMEOUT });
  });

  it('handles multiple planes taking off', async () => {
    console.log('Test started: handles multiple planes taking off');
    (isStormy as jest.Mock).mockReturnValue(false);
    console.log('Rendering Airport component');
    render(<Airport PlaneClass={MockPlane} />);
    console.log('Airport component rendered');

    console.log('Starting to land 3 planes');
    await waitFor(async () => {
      await landMultiplePlanes(3);
    }, { timeout: TIMEOUT });
    console.log('Finished landing 3 planes');

    console.log('Verifying hanger count after landing');
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      console.log('Current hanger count:', hangerCount.textContent);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 3');
    }, { timeout: TIMEOUT });

    console.log('Starting to take off 2 planes');
    await waitFor(async () => {
      await takeOffMultiplePlanes(2);
    }, { timeout: TIMEOUT });
    console.log('Finished taking off 2 planes');

    console.log('Verifying final hanger count');
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      console.log('Final hanger count:', hangerCount.textContent);
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    console.log('Test completed: handles multiple planes taking off');
  });

  it('verifies plane IDs in the hangar after multiple operations', async () => {
    console.log('Test started: verifies plane IDs in the hangar after multiple operations');
    (isStormy as jest.Mock).mockReturnValue(false);
    console.log('Rendering Airport component');
    render(<Airport PlaneClass={MockPlane} />);
    console.log('Airport component rendered');

    console.log('Landing 3 planes');
    await waitFor(async () => {
      await landMultiplePlanes(3);
    }, { timeout: TIMEOUT });
    console.log('3 planes landed');

    console.log('Taking off 2 planes');
    await waitFor(async () => {
      await takeOffMultiplePlanes(2);
    }, { timeout: TIMEOUT });
    console.log('2 planes took off');

    console.log('Landing 2 more planes');
    await waitFor(async () => {
      await landMultiplePlanes(2);
    }, { timeout: TIMEOUT });
    console.log('2 more planes landed');

    console.log('Verifying hangar planes');
    await waitFor(() => {
      const hangarPlanes = screen.getAllByTestId('plane-item');
      console.log('Number of planes in hangar:', hangarPlanes.length);
      console.log('Plane IDs:', hangarPlanes.map(plane => plane.textContent));

      expect(hangarPlanes).toHaveLength(3);
      expect(hangarPlanes[0]).toHaveTextContent('Plane 1');
      expect(hangarPlanes[1]).toHaveTextContent('Plane 4');
      expect(hangarPlanes[2]).toHaveTextContent('Plane 5');

      expect(hangarPlanes.length).toEqual(3);
      expect(hangarPlanes[0].textContent).toEqual('Plane 1');
      expect(hangarPlanes[1].textContent).toEqual('Plane 4');
      expect(hangarPlanes[2].textContent).toEqual('Plane 5');
    }, { timeout: TIMEOUT });

    console.log('Test completed: verifies plane IDs in the hangar after multiple operations');
  });

  // Test case to display appropriate error message when weather turns stormy during landing
  it('displays appropriate error message when weather turns stormy during landing', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Start landing process
    await userEvent.click(landButton);

    // Simulate weather turning stormy
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to land another plane
    await userEvent.click(landButton);
    await waitFor(() => {
      return screen.findByText('Stormy weather, cannot land the plane!').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: TIMEOUT });
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Land a plane
    await userEvent.click(landButton);
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to take off the plane
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(() => {
      return screen.findByText('Stormy weather, unable to take off!').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: TIMEOUT });
  });

  it('ensures state persistence across different actions', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land a plane
    await userEvent.click(landButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });

    // Take off the plane
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 0');
    }, { timeout: TIMEOUT });

    // Land another plane
    await userEvent.click(landButton);
    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT });
  });

  it('verifies that isStormy mock function is called', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Land a plane
    await userEvent.click(landButton);
    await userEvent.click(landButton);
    await waitFor(() => expect(isStormy).toHaveBeenCalled());
  });
});
