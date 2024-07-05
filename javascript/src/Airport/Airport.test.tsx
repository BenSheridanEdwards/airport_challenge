import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';

jest.setTimeout(10000);

jest.mock('../Weather/Weather', () => ({
  isStormy: jest.fn(),
}));

describe('Airport Component', () => {
  beforeEach(() => {
    (isStormy as jest.Mock).mockReturnValue(false);
    jest.resetAllMocks();
  });

  it('renders Airport component', () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    expect(screen.getByText('Airport')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 5')).toBeInTheDocument();
    expect(screen.getByText('Planes in hanger: 0')).toBeInTheDocument();
  });

  it('lands a plane successfully', async () => {
    const generateUniqueId = jest.fn()
      .mockReturnValueOnce('mocked-plane-id-1')
      .mockReturnValueOnce('mocked-plane-id-2');
    render(<Airport generateUniqueId={generateUniqueId} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    expect(await screen.findByText(/Planes\s+in\s+hanger:\s*1/)).toBeInTheDocument();
  });

  it('prevents landing when hanger is full', async () => {
    const generateUniqueId = jest.fn()
      .mockReturnValueOnce('mocked-plane-id-1')
      .mockReturnValueOnce('mocked-plane-id-2')
      .mockReturnValueOnce('mocked-plane-id-3')
      .mockReturnValueOnce('mocked-plane-id-4')
      .mockReturnValueOnce('mocked-plane-id-5');
    render(<Airport generateUniqueId={generateUniqueId} />);
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
      expect(await screen.findByText(`Planes in hanger: ${i + 1}`)).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    expect(await screen.findByText('Hanger full, abort landing!')).toBeInTheDocument();
  });

  it('prevents landing when weather is stormy', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport generateUniqueId={generateUniqueId} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    expect(await screen.findByText(/Stormy\s+weather,\s+cannot\s+land\s+the\s+plane!/)).toBeInTheDocument();
  });

  it('prevents landing when plane is already in hanger', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport generateUniqueId={generateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);
    expect(await screen.findByText(/Planes\s+in\s+hanger:\s*1/)).toBeInTheDocument();
    console.log('Hanger state after first landing:', screen.getByTestId('hanger-container').textContent);
    await userEvent.click(landButton);
    console.log('Hanger state after second landing attempt:', screen.getByTestId('hanger-container').textContent);
    await waitFor(async () => {
      const hangerContainer = screen.getByTestId('hanger-container');
      const alreadyHereMessage = await within(hangerContainer).findByText(/That\s+plane\s+is\s+already\s+here/);
      expect(alreadyHereMessage).toBeInTheDocument();
    });
  });

  it('takes off a plane successfully', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    expect(await screen.findByText(/Planes\s+in\s+hanger:\s*0/)).toBeInTheDocument();
  });

  it('prevents takeoff when weather is stormy', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    expect(await screen.findByText(/Stormy\s+weather,\s+unable\s+to\s+take\s+off!/)).toBeInTheDocument();
  });

  it('prevents takeoff when no planes are available', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    expect(await screen.findByText(/No\s+planes\s+available\s+for\s+takeoff/)).toBeInTheDocument();
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport generateUniqueId={generateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
    await userEvent.click(landButton);
    expect(await screen.findByText(/Plane\s+landed\s+successfully\./)).toBeInTheDocument();
    await userEvent.click(takeOffButton);
    expect(await screen.findByText(/Plane\s+took\s+off\s+successfully\./)).toBeInTheDocument();
    await userEvent.click(takeOffButton);
    const hangerContainer = screen.getByTestId('hanger-container');
    const notHereMessage = await within(hangerContainer).findByText(/No\s+planes\s+available\s+for\s+takeoff/);
    expect(notHereMessage).toBeInTheDocument();
  });

  it('handles multiple planes landing and taking off in sequence', async () => {
    const generateUniqueId = jest.fn()
      .mockReturnValueOnce('mocked-plane-id-1')
      .mockReturnValueOnce('mocked-plane-id-2')
      .mockReturnValueOnce('mocked-plane-id-3')
      .mockReturnValueOnce('mocked-plane-id-4')
      .mockReturnValueOnce('mocked-plane-id-5');
    render(<Airport generateUniqueId={generateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land 3 planes
    for (let i = 0; i < 3; i++) {
      await userEvent.click(landButton);
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText(new RegExp(`Planes\\s+in\\s+hanger:\\s*${i + 1}`))).toBeInTheDocument();
    }

    // Take off 2 planes
    for (let i = 2; i >= 1; i--) {
      await userEvent.click(takeOffButton);
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText(new RegExp(`Planes\\s+in\\s+hanger:\\s*${i}`))).toBeInTheDocument();
    }

    // Land 2 more planes
    for (let i = 1; i <= 2; i++) {
      await userEvent.click(landButton);
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText(new RegExp(`Planes\\s+in\\s+hanger:\\s*${i + 1}`))).toBeInTheDocument();
    }
  });

  // Test case to display appropriate error message when weather turns stormy during landing
  it('displays appropriate error message when weather turns stormy during landing', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Start landing process
    await userEvent.click(landButton);

    // Simulate weather turning stormy
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to land another plane
    await userEvent.click(landButton);
    await waitFor(async () => {
      const errorMessage = await screen.findByText(/Stormy weather, cannot land the plane!/);
      expect(errorMessage).toBeInTheDocument();
    }, { timeout: 20000 });
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land a plane
    await userEvent.click(landButton);
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to take off the plane
    await waitFor(async () => {
      await userEvent.click(takeOffButton);
      expect(await screen.findByText(/Stormy\s+weather,\s+unable\s+to\s+take\s+off!/)).toBeInTheDocument();
    });
  });

  it('ensures state persistence across different actions', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land a plane
    await userEvent.click(landButton);
    await expect(await screen.findByText(/Planes\s+in\s+hanger:\s*1/)).toBeInTheDocument();

    // Take off the plane
    await userEvent.click(takeOffButton);
    await expect(await screen.findByText(/Planes\s+in\s+hanger:\s*0/)).toBeInTheDocument();

    // Land another plane
    await userEvent.click(landButton);
    await expect(await screen.findByText(/Planes\s+in\s+hanger:\s*1/)).toBeInTheDocument();
  });

  it('verifies that isStormy mock function is called', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Land a plane
    await userEvent.click(landButton);
    await userEvent.click(landButton);
    await waitFor(() => expect(isStormy).toHaveBeenCalled());
  });
});
