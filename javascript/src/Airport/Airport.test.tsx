import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';
import Plane from '../Plane/Plane';

jest.mock('../Plane/Plane', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        id: 'mock-id',
        airborn: false,
        landed: jest.fn().mockReturnThis(),
        inTheAir: jest.fn().mockReturnThis(),
      };
    }),
  };
});

jest.mock('../Weather/Weather', () => ({
  isStormy: jest.fn(),
}));

describe('Airport Component', () => {
  beforeEach(() => {
    (isStormy as jest.Mock).mockReturnValue(false);
  });

  it('renders Airport component', () => {
    render(<Airport PlaneClass={Plane} />);
    expect(screen.getByText('Airport')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 5')).toBeInTheDocument();
    expect(screen.getByText('Planes in hanger: 0')).toBeInTheDocument();
  });

  it('lands a plane successfully', async () => {
    render(<Airport PlaneClass={Plane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);
    const hangerContainer = screen.getByTestId('hanger-container');
    await waitFor(() => {
      console.log('Planes in hanger:', hangerContainer.textContent);
      expect(within(hangerContainer).getByText((content) => content.trim().includes('Planes in hanger: 1'))).toBeInTheDocument();
    });
  });

  it('prevents landing when hanger is full', async () => {
    render(<Airport PlaneClass={Plane} />);
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
      const hangerContainer = screen.getByTestId('hanger-container');
      await waitFor(() => {
        expect(within(hangerContainer).getByText((content) => content.trim().includes(`Planes in hanger: ${i + 1}`))).toBeInTheDocument();
      });
    }
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    const hangerContainer = screen.getByTestId('hanger-container');
    await waitFor(() => {
      expect(within(hangerContainer).getByText('Hanger full, abort landing!')).toBeInTheDocument();
    });
  });

  it('prevents landing when weather is stormy', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport PlaneClass={Plane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    expect(await screen.findByText('Stormy weather, cannot land the plane!')).toBeInTheDocument();
  });

  it('prevents landing when plane is already in hanger', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={Plane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);
    const hangerContainer = screen.getByTestId('hanger-container');
    await waitFor(() => {
      expect(within(hangerContainer).getByText((content) => content.trim().includes('Planes in hanger: 1'))).toBeInTheDocument();
    });
    await userEvent.click(landButton);
    await waitFor(() => {
      expect(within(hangerContainer).getByText('That plane is already here')).toBeInTheDocument();
    });
  });

  it('takes off a plane successfully', async () => {
    render(<Airport PlaneClass={Plane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content) => content.trim().includes('Planes in hanger: 0'))).toBeInTheDocument();
  });

  it('prevents takeoff when weather is stormy', async () => {
    render(<Airport PlaneClass={Plane} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content) => content.trim().includes('Stormy weather, unable to take off!'))).toBeInTheDocument();
  });

  it('prevents takeoff when no planes are available', async () => {
    render(<Airport PlaneClass={Plane} />);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content) => content.trim().includes('No planes available for takeoff'))).toBeInTheDocument();
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport PlaneClass={Plane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
    await userEvent.click(landButton);
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content) => content.trim().includes('Plane landed successfully.'))).toBeInTheDocument();
    await userEvent.click(takeOffButton);
    expect(await within(hangerContainer).findByText((content) => content.trim().includes('Plane took off successfully.'))).toBeInTheDocument();
    await userEvent.click(takeOffButton);
    const notHereMessage = await within(hangerContainer).findByText((content) => content.trim().includes('No planes available for takeoff'));
    expect(notHereMessage).toBeInTheDocument();
  });

  it('handles multiple planes landing and taking off in sequence', async () => {
    render(<Airport PlaneClass={Plane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land 3 planes
    for (let i = 0; i < 3; i++) {
      await userEvent.click(landButton);
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText((content) => content.trim().includes(`Planes in hanger: ${i + 1}`))).toBeInTheDocument();
    }

    // Take off 2 planes
    for (let i = 2; i >= 1; i--) {
      await userEvent.click(takeOffButton);
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText((content) => content.trim().includes(`Planes in hanger: ${i}`))).toBeInTheDocument();
    }

    // Land 2 more planes
    for (let i = 1; i <= 2; i++) {
      await userEvent.click(landButton);
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText((content) => content.trim().includes(`Planes in hanger: ${i + 1}`))).toBeInTheDocument();
    }
  });

  // Test case to display appropriate error message when weather turns stormy during landing
  it('displays appropriate error message when weather turns stormy during landing', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport PlaneClass={Plane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Start landing process
    await userEvent.click(landButton);

    // Simulate weather turning stormy
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to land another plane
    await userEvent.click(landButton);
    await waitFor(async () => {
      expect(await screen.findByText((content) => content.trim().includes('Stormy weather, cannot land the plane!'))).toBeInTheDocument();
    });
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport PlaneClass={Plane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Land a plane
    await userEvent.click(landButton);
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to take off the plane
    await waitFor(async () => {
      expect(await screen.findByText((content) => content.trim().includes('Stormy weather, unable to take off!'))).toBeInTheDocument();
    });
  });

  it('ensures state persistence across different actions', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport PlaneClass={Plane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land a plane
    await userEvent.click(landButton);
    await expect(await screen.findByText((content) => content.trim().includes('Planes in hanger: 1'))).toBeInTheDocument();

    // Take off the plane
    await userEvent.click(takeOffButton);
    await expect(await screen.findByText((content) => content.trim().includes('Planes in hanger: 0'))).toBeInTheDocument();

    // Land another plane
    await userEvent.click(landButton);
    await expect(await screen.findByText((content) => content.trim().includes('Planes in hanger: 1'))).toBeInTheDocument();
  });

  it('verifies that isStormy mock function is called', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport PlaneClass={Plane} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Land a plane
    await userEvent.click(landButton);
    await userEvent.click(landButton);
    await waitFor(() => expect(isStormy).toHaveBeenCalled());
  });
});
