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

async function retryOperation(operation: () => Promise<void>, maxRetries: number = 3): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await operation();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.warn(`Retry ${i + 1}/${maxRetries} failed:`, error);
    }
  }
}

const landMultiplePlanes = async (count: number) => {
  const landButton = screen.getByRole('button', { name: /land plane/i });
  const planeIdInput = screen.getByTestId('plane-id-input');
  for (let i = 0; i < count; i++) {
    const planeId = `plane-${i + 1}`;
    await retryOperation(async () => {
      await act(async () => {
        await userEvent.type(planeIdInput, planeId);
        await userEvent.click(landButton);
      });
      await waitFor(() => {
        expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${i + 1}`);
      }, { timeout: TIMEOUT });
    });
  }
};

const takeOffMultiplePlanes = async (count: number) => {
  const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
  for (let i = 0; i < count; i++) {
    await retryOperation(async () => {
      await act(async () => {
        await userEvent.click(takeOffButton);
      });
      await waitFor(() => {
        expect(screen.getByTestId('hanger-count')).toHaveTextContent(`Planes in hanger: ${count - i - 1}`);
      }, { timeout: TIMEOUT });
    });
  }
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
    expect(screen.getByText('Airport Capacity: 5 planes')).toBeInTheDocument();
    expect(screen.getByText('Planes in hanger: 0')).toBeInTheDocument();
  });

  it('lands a plane successfully', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);

    await waitFor(() => {
      const hangerCount = screen.getByTestId('hanger-count');
      expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    }, { timeout: TIMEOUT }).catch(error => {
      console.error('Timeout waiting for hanger count to update:', error);
      throw error;
    });
  });

  it('prevents landing when hanger is full', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await retryOperation(async () => {
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
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await waitFor(() => {
      return screen.findByText('Stormy weather, cannot land the plane!').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: TIMEOUT }).catch(error => {
      console.error('Timeout waiting for stormy weather message:', error);
      throw error;
    });
  });

  it('prevents landing when plane is already in hanger', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const planeIdInput = screen.getByTestId('plane-id-input');

    const planeId = 'test-plane-id';
    await retryOperation(async () => {
      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);

      const hangerContainer = screen.getByTestId('hanger-container');
      await waitFor(() => {
        expect(within(hangerContainer).getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Planes in hanger: 1'))).toBeInTheDocument();
      }, { timeout: TIMEOUT });

      await userEvent.type(planeIdInput, planeId);
      await userEvent.click(landButton);
      await waitFor(() => {
        return screen.findByText('That plane is already here').then((element) => {
          expect(element).toBeInTheDocument();
        });
      }, { timeout: TIMEOUT });
    });
  });

  it('takes off a plane successfully', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await retryOperation(async () => {
      await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
      await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
      await waitFor(() => {
        const hangerContainer = screen.getByTestId('hanger-container');
        expect(within(hangerContainer).getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Planes in hanger: 0'))).toBeInTheDocument();
      }, { timeout: TIMEOUT });
    });
  });

  it('prevents takeoff when weather is stormy', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await retryOperation(async () => {
      await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
      (isStormy as jest.Mock).mockReturnValue(true);
      await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
      await waitFor(() => {
        return screen.findByText('Stormy weather, unable to take off!').then((element) => {
          expect(element).toBeInTheDocument();
        });
      }, { timeout: TIMEOUT });
    });
  });

  it('prevents takeoff when no planes are available', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(() => {
      return screen.findByText('No planes available for takeoff.').then((element) => {
        expect(element).toBeInTheDocument();
      });
    }, { timeout: TIMEOUT }).catch(error => {
      console.error('Timeout waiting for no planes available message:', error);
      throw error;
    });
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);
    await retryOperation(async () => {
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
  });

  it('handles multiple planes landing', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);

    await retryOperation(async () => {
      await landMultiplePlanes(3);
      await waitFor(() => {
        expect(screen.getByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 3');
      }, { timeout: TIMEOUT });
    });
  });

  it('handles multiple planes taking off', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);

    await retryOperation(async () => {
      await landMultiplePlanes(3);
      await screen.findByText('Planes in hanger: 3', {}, { timeout: TIMEOUT });

      await takeOffMultiplePlanes(2);
      await screen.findByText('Planes in hanger: 1', {}, { timeout: TIMEOUT });
    });
  });

  it('verifies plane IDs in the hangar after multiple operations', async () => {
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);

    await retryOperation(async () => {
      await landMultiplePlanes(3);
      await takeOffMultiplePlanes(2);
      await landMultiplePlanes(2);

      await waitFor(() => {
        const hangarPlanes = screen.getAllByTestId('plane-item');
        expect(hangarPlanes).toHaveLength(3);
        expect(hangarPlanes.map(plane => plane.textContent)).toEqual(['plane-1', 'plane-4', 'plane-5']);
      }, { timeout: TIMEOUT });
    });
  });

  it('displays appropriate error message when weather turns stormy during landing', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    await retryOperation(async () => {
      await userEvent.click(landButton);
      (isStormy as jest.Mock).mockReturnValue(true);
      await userEvent.click(landButton);
      await waitFor(() => {
        return screen.findByText('Stormy weather, cannot land the plane!').then((element) => {
          expect(element).toBeInTheDocument();
        });
      }, { timeout: TIMEOUT });
    });
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    await retryOperation(async () => {
      await userEvent.click(landButton);
      (isStormy as jest.Mock).mockReturnValue(true);
      await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
      await waitFor(() => {
        return screen.findByText('Stormy weather, unable to take off!').then((element) => {
          expect(element).toBeInTheDocument();
        });
      }, { timeout: TIMEOUT });
    });
  });

  it('ensures state persistence across different actions', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    await retryOperation(async () => {
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
  });

  it('verifies that isStormy mock function is called during landing and takeoff', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    await retryOperation(async () => {
      await userEvent.click(landButton);
      await waitFor(() => expect(isStormy).toHaveBeenCalled());

      (isStormy as jest.Mock).mockClear();

      await userEvent.click(takeOffButton);
      await waitFor(() => expect(isStormy).toHaveBeenCalled());
    });
  });
});