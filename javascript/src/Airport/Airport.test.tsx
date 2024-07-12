import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';

interface MockPlaneInstance {
  id: string;
  airborn: boolean;
  landed: jest.Mock;
  inTheAir: jest.Mock;
}

const instances: MockPlaneInstance[] = [];

jest.mock('../Plane/Plane', () => {
  const mockPlane = jest.fn().mockImplementation(function (this: MockPlaneInstance, id: string) {
    this.id = id || '_' + Math.random().toString(36).substr(2, 9);
    this.airborn = false;
    this.landed = jest.fn().mockReturnThis();
    this.inTheAir = jest.fn().mockReturnThis();
    instances.push(this);
    return this;
  });
  return {
    __esModule: true,
    default: mockPlane,
    instances,
  };
});

jest.mock('../Weather/Weather', () => ({
  isStormy: jest.fn(),
}));

describe('Airport Component', () => {
  const MockPlane = jest.requireActual('../Plane/Plane').default;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    (isStormy as jest.Mock).mockReturnValue(false);
    instances.length = 0; // Clear the instances array before each test
    document.body.innerHTML = ''; // Clear toast notifications
  });

  it('renders Airport component', () => {
    render(<Airport PlaneClass={MockPlane} />);
    expect(screen.getByText('Airport')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 5')).toBeInTheDocument();
    expect(screen.getByText('Planes in hangar: 0')).toBeInTheDocument();
  });

  it('lands a plane successfully', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);
    await waitFor(() => {
      const hangarCount = screen.getByTestId('hangar-count');
      expect(hangarCount).toHaveTextContent('Planes in hangar: 1');
    }, { timeout: 5000 });
  });

  it('prevents landing when hangar is full', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
      await waitFor(() => {
        const hangarCount = screen.getByTestId('hangar-count');
        expect(hangarCount).toHaveTextContent(`Planes in hangar: ${i + 1}`);
      }, { timeout: 5000 });
    }
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await waitFor(() => {
      const hangarCount = screen.getByTestId('hangar-count');
      expect(hangarCount).toHaveTextContent('Planes in hangar: 5');
    }, { timeout: 5000 });
    await waitFor(() => {
      const errorMessage = screen.getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Hangar full, abort landing!'));
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await waitFor(() => {
      return screen.findByText('Stormy weather, cannot land the plane!').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: 5000 });
  });

  it('prevents landing when plane is already in hangar', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const planeIdInput = screen.getByTestId('plane-id-input');

    // Enter the planeId and land the plane
    const planeId = 'test-plane-id';
    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);

    const hangarContainer = screen.getByTestId('hangar-container');
    await waitFor(() => {
      expect(within(hangarContainer).getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Planes in hangar: 1'))).toBeInTheDocument();
    }, { timeout: 5000 });

    // Attempt to land the same plane again
    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);
    await waitFor(() => {
      return screen.findByText('That plane is already here').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: 5000 });
  });

  it('takes off a plane successfully', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(() => {
      const hangarContainer = screen.getByTestId('hangar-container');
      expect(within(hangarContainer).getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Planes in hangar: 0'))).toBeInTheDocument();
    }, { timeout: 5000 });
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
    }, { timeout: 5000 });
  });

  it('prevents takeoff when no planes are available', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(() => {
      return screen.findByText('No planes available for takeoff.').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: 5000 });
  });

  it('prevents takeoff when plane is not in hangar', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
    await userEvent.click(landButton);
    await waitFor(async () => {
      const hangarCount = screen.getByTestId('hangar-count');
      expect(hangarCount).toHaveTextContent('Planes in hangar: 1');
    }, { timeout: 5000 });
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      const hangarCount = screen.getByTestId('hangar-count');
      expect(hangarCount).toHaveTextContent('Planes in hangar: 0');
    }, { timeout: 5000 });
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      return screen.findByText('No planes available for takeoff.').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: 5000 });
  });

  it('handles multiple planes landing and taking off in sequence', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land 3 planes
    for (let i = 0; i < 3; i++) {
      await userEvent.click(landButton);
      await waitFor(() => {
        const hangarCount = screen.getByTestId('hangar-count');
        expect(hangarCount).toHaveTextContent(`Planes in hangar: ${i + 1}`);
      }, { timeout: 5000 });
    }

    // Take off 2 planes
    for (let i = 0; i < 2; i++) {
      await userEvent.click(takeOffButton);
      await waitFor(() => {
        const hangarCount = screen.getByTestId('hangar-count');
        expect(hangarCount).toHaveTextContent(`Planes in hangar: ${2 - i}`);
      }, { timeout: 5000 });
    }

    // Land 2 more planes
    for (let i = 0; i < 2; i++) {
      await userEvent.click(landButton);
      await waitFor(() => {
        const hangarCount = screen.getByTestId('hangar-count');
        expect(hangarCount).toHaveTextContent(`Planes in hangar: ${2 + i}`);
      }, { timeout: 5000 });
    }

    await waitFor(() => {
      const hangarCount = screen.getByTestId('hangar-count');
      expect(hangarCount).toHaveTextContent('Planes in hangar: 3');
    }, { timeout: 5000 });
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
    }, { timeout: 5000 });
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
    }, { timeout: 5000 });
  });

  it('ensures state persistence across different actions', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land a plane
    await userEvent.click(landButton);
    await waitFor(() => {
      const hangarCount = screen.getByTestId('hangar-count');
      expect(hangarCount).toHaveTextContent('Planes in hangar: 1');
    }, { timeout: 5000 });

    // Take off the plane
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      const hangarCount = screen.getByTestId('hangar-count');
      expect(hangarCount).toHaveTextContent('Planes in hangar: 0');
    }, { timeout: 5000 });

    // Land another plane
    await userEvent.click(landButton);
    await waitFor(() => {
      const hangarCount = screen.getByTestId('hangar-count');
      expect(hangarCount).toHaveTextContent('Planes in hangar: 1');
    }, { timeout: 5000 });
  });

  it('verifies that isStormy mock function is called', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Land a plane
    await userEvent.click(landButton);
    await userEvent.click(landButton);
    await waitFor(() => expect(isStormy).toHaveBeenCalled());
  });

  it('throws an error if generateUniqueId returns an empty string', async () => {
    const MockGenerateUniqueId = jest.fn().mockReturnValue('');
    render(<Airport PlaneClass={MockPlane} generateUniqueId={MockGenerateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);
    await waitFor(() => {
      const errorMessage = screen.getByText('Error generating unique ID, aborting landing process');
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('throws an error if generateUniqueId returns null', async () => {
    const MockGenerateUniqueId = jest.fn().mockReturnValue(null);
    render(<Airport PlaneClass={MockPlane} generateUniqueId={MockGenerateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);
    await waitFor(() => {
      const errorMessage = screen.getByText('Error generating unique ID, aborting landing process');
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles errors in handleLand function when hangar is full', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Fill the hangar
    for (let i = 0; i < 5; i++) {
      await userEvent.click(landButton);
    }

    // Attempt to land another plane
    await userEvent.click(landButton);
    await waitFor(() => {
      const errorMessage = screen.getByText('Hangar full, abort landing!');
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles errors in handleTakeOff function', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      const errorMessage = screen.getByText('No planes available for takeoff.');
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('verifies useEffect hook for pendingOperations state management', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);
    await waitFor(() => {
      const hangarCount = screen.getByTestId('hangar-count');
      expect(hangarCount).toHaveTextContent('Planes in hangar: 1');
    }, { timeout: 5000 });
    await waitFor(() => {
      const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
      expect(takeOffButton).not.toBeDisabled();
    }, { timeout: 5000 });
  });

  it('throws an error if createPlane is called with undefined ID', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const planeIdInput = screen.getByTestId('plane-id-input');

    // Attempt to land a plane without typing anything into the input
    await userEvent.clear(planeIdInput);
    await userEvent.click(landButton);

    await waitFor(() => {
      const toastMessage = screen.getByText((content) => content.includes('Error generating unique ID, aborting landing process'));
      expect(toastMessage).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
