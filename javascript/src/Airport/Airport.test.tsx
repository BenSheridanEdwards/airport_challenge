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
    console.log = jest.fn(); // Mock console.log to track logs
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
    const hangerCount = await screen.findByTestId('hanger-count');
    expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
  });

  it('prevents landing when hanger is full', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
      await waitFor(() => {
        const hangerContainer = screen.getByTestId('hanger-container');
        expect(within(hangerContainer).getByText((content) => content.replace(/\s+/g, ' ').trim().includes(`Planes in hanger: ${i + 1}`))).toBeInTheDocument();
      });
    }
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await waitFor(() => {
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(within(hangerContainer).getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Hanger full, abort landing!'))).toBeInTheDocument();
    });
  });

  it('prevents landing when weather is stormy', async () => {
    // Removed unused generateUniqueId mock function
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await waitFor(() => {
      expect(screen.getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Stormy weather, cannot land the plane!'))).toBeInTheDocument();
    });
  });

  // Test to prevent landing when plane is already in hanger
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
    });

    // Attempt to land the same plane again
    await userEvent.type(planeIdInput, planeId);
    await userEvent.click(landButton);
    await waitFor(() => {
      const messageElement = screen.getByTestId('message');
      expect(messageElement).toHaveTextContent('That plane is already here');
    }, { timeout: 5000 });
  });

  it('takes off a plane successfully', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(() => {
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(within(hangerContainer).getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Planes in hanger: 0'))).toBeInTheDocument();
    });
  });

  it('prevents takeoff when weather is stormy', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content) => content.replace(/\s+/g, ' ').trim().includes('Stormy weather, unable to take off!'))).toBeInTheDocument();
  });

  it('prevents takeoff when no planes are available', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content) => content.replace(/\s+/g, ' ').trim().includes('No planes available for takeoff'))).toBeInTheDocument();
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    // Removed unused generateUniqueId mock function
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
    await userEvent.click(landButton);
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content) => content.replace(/\s+/g, ' ').trim().includes('Plane landed successfully.'))).toBeInTheDocument();
    await userEvent.click(takeOffButton);
    expect(await within(hangerContainer).findByText((content) => content.replace(/\s+/g, ' ').trim().includes('Plane took off successfully.'))).toBeInTheDocument();
    await userEvent.click(takeOffButton);
    const notHereMessage = await within(hangerContainer).findByText((content) => content.replace(/\s+/g, ' ').trim().includes('No planes available for takeoff'));
    expect(notHereMessage).toBeInTheDocument();
  });

  it('handles multiple planes landing and taking off in sequence', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land 3 planes
    for (let i = 0; i < 3; i++) {
      await userEvent.click(landButton);
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText((content) => content.replace(/\s+/g, ' ').trim().includes(`Planes in hanger: ${i + 1}`))).toBeInTheDocument();
    }

    // Take off 2 planes
    for (let i = 2; i >= 1; i--) {
      await userEvent.click(takeOffButton);
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText((content) => content.replace(/\s+/g, ' ').trim().includes(`Planes in hanger: ${i}`))).toBeInTheDocument();
    }

    // Land 2 more planes
    for (let i = 1; i <= 2; i++) {
      await userEvent.click(landButton);
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText((content) => content.replace(/\s+/g, ' ').trim().includes(`Planes in hanger: ${i + 1}`))).toBeInTheDocument();
    }
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
      expect(screen.getByText((content) => content.replace(/\s+/g, ' ').trim().includes('Stormy weather, cannot land the plane!'))).toBeInTheDocument();
    });
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Land a plane
    await userEvent.click(landButton);
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to take off the plane
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    await waitFor(async () => {
      expect(await screen.findByText((content) => content.replace(/\s+/g, ' ').trim().includes('Stormy weather, unable to take off!'))).toBeInTheDocument();
    });
  });

  it('ensures state persistence across different actions', async () => {
    render(<Airport PlaneClass={MockPlane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land a plane
    await userEvent.click(landButton);
    await expect(await screen.findByText((content) => content.replace(/\s+/g, ' ').trim().includes('Planes in hanger: 1'))).toBeInTheDocument();

    // Take off the plane
    await userEvent.click(takeOffButton);
    await expect(await screen.findByText((content) => content.replace(/\s+/g, ' ').trim().includes('Planes in hanger: 0'))).toBeInTheDocument();

    // Land another plane
    await userEvent.click(landButton);
    await expect(await screen.findByText((content) => content.replace(/\s+/g, ' ').trim().includes('Planes in hanger: 1'))).toBeInTheDocument();
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
