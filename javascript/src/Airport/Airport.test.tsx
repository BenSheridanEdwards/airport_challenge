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

interface MockPlane {
  id: string;
  airborn: boolean;
  landed: jest.Mock;
  inTheAir: jest.Mock;
}

jest.mock('../Plane/Plane', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(function (this: MockPlane, id: string) {
      this.id = id;
      this.airborn = false;
      this.landed = jest.fn(function (this: MockPlane) {
        this.airborn = false;
      });
      this.inTheAir = jest.fn(function (this: MockPlane) {
        this.airborn = true;
      });
    }),
  };
});

describe('Airport Component', () => {
  beforeEach(() => {
    (isStormy as jest.Mock).mockReturnValue(false);
    jest.resetAllMocks();
    jest.clearAllMocks();
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
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content, element) => {
      return element !== null && element.textContent !== null && /Planes\s+in\s+hanger:\s+1/.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();
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
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText((content, element) => {
        return element !== null && element.textContent !== null && new RegExp(`Planes\\s+in\\s+hanger:\\s+${i + 1}`).test(element.textContent.replace(/\s+/g, ' ').trim());
      })).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content, element) => {
      return element !== null && element.textContent !== null && /Hanger\s+full,\s+abort\s+landing!/.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();
  });

  it('prevents landing when weather is stormy', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport generateUniqueId={generateUniqueId} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    expect(await screen.findByText((content, element) => {
      return element !== null && element.textContent !== null && /Stormy\s+weather,\s+cannot\s+land\s+the\s+plane!/.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();
  });

  it('prevents landing when plane is already in hanger', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport generateUniqueId={generateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    await userEvent.click(landButton);
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content, element) => {
      return element !== null && element.textContent !== null && /Planes\s+in\s+hanger:\s+1/.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();
    await userEvent.click(landButton);
    expect(await within(hangerContainer).findByText((content, element) => {
      return element !== null && element.textContent !== null && /That\s+plane\s+is\s+already\s+here/.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();
  });

  it('takes off a plane successfully', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content, element) => {
      return element !== null && element.textContent !== null && /Planes\s+in\s+hanger:\s+0/.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();
  });

  it('prevents takeoff when weather is stormy', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    await userEvent.click(screen.getByRole('button', { name: /land plane/i }));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content, element) => {
      return element !== null && element.textContent !== null && /Stormy\s+weather,\s+unable\s+to\s+take\s+off!/.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();
  });

  it('prevents takeoff when no planes are available', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    await userEvent.click(screen.getByRole('button', { name: /take off plane/i }));
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content, element) => {
      return element !== null && element.textContent !== null && /No\s+planes\s+available\s+for\s+takeoff/.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    (isStormy as jest.Mock).mockReturnValue(false);
    render(<Airport generateUniqueId={generateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });
    await userEvent.click(landButton);
    const hangerContainer = screen.getByTestId('hanger-container');
    expect(await within(hangerContainer).findByText((content, element) => {
      return element !== null && element.textContent !== null && /Plane\s+landed\s+successfully./.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();
    await userEvent.click(takeOffButton);
    expect(await within(hangerContainer).findByText((content, element) => {
      return element !== null && element.textContent !== null && /Plane\s+took\s+off\s+successfully./.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();
    await userEvent.click(takeOffButton);
    const notHereMessage = await within(hangerContainer).findByText((content, element) => {
      return element !== null && element.textContent !== null && /No\s+planes\s+available\s+for\s+takeoff/.test(element.textContent.replace(/\s+/g, ' ').trim());
    });
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
      expect(await within(hangerContainer).findByText((content, element) => {
        return element !== null && element.textContent !== null && new RegExp(`Planes\\s+in\\s+hanger:\\s+${i + 1}`).test(element.textContent.replace(/\s+/g, ' ').trim());
      })).toBeInTheDocument();
    }

    // Take off 2 planes
    for (let i = 2; i >= 1; i--) {
      await userEvent.click(takeOffButton);
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText((content, element) => {
        return element !== null && element.textContent !== null && new RegExp(`Planes\\s+in\\s+hanger:\\s+${i}`).test(element.textContent.replace(/\s+/g, ' ').trim());
      })).toBeInTheDocument();
    }

    // Land 2 more planes
    for (let i = 1; i <= 2; i++) {
      await userEvent.click(landButton);
      const hangerContainer = screen.getByTestId('hanger-container');
      expect(await within(hangerContainer).findByText((content, element) => {
        return element !== null && element.textContent !== null && new RegExp(`Planes\\s+in\\s+hanger:\\s+${i + 1}`).test(element.textContent.replace(/\s+/g, ' ').trim());
      })).toBeInTheDocument();
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
      expect(await screen.findByText((content, element) => {
        return element !== null && element.textContent !== null && /Stormy\s+weather,\s+cannot\s+land\s+the\s+plane!/.test(element.textContent.replace(/\s+/g, ' ').trim());
      })).toBeInTheDocument();
    });
  });

  it('displays appropriate error message when weather turns stormy during takeoff', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });

    // Land a plane
    await userEvent.click(landButton);
    (isStormy as jest.Mock).mockReturnValue(true);

    // Attempt to take off the plane
    await waitFor(async () => {
      expect(await screen.findByText((content, element) => {
        return element !== null && element.textContent !== null && /Stormy\s+weather,\s+unable\s+to\s+take\s+off!/.test(element.textContent.replace(/\s+/g, ' ').trim());
      })).toBeInTheDocument();
    });
  });

  it('ensures state persistence across different actions', async () => {
    const generateUniqueId = jest.fn().mockReturnValue('mocked-plane-id');
    render(<Airport generateUniqueId={generateUniqueId} />);
    const landButton = screen.getByRole('button', { name: /land plane/i });
    const takeOffButton = screen.getByRole('button', { name: /take off plane/i });

    // Land a plane
    await userEvent.click(landButton);
    await expect(await screen.findByText((content, element) => {
      return element !== null && element.textContent !== null && /Planes\s+in\s+hanger:\s+1/.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();

    // Take off the plane
    await userEvent.click(takeOffButton);
    await expect(await screen.findByText((content, element) => {
      return element !== null && element.textContent !== null && /Planes\s+in\s+hanger:\s+0/.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();

    // Land another plane
    await userEvent.click(landButton);
    await expect(await screen.findByText((content, element) => {
      return element !== null && element.textContent !== null && /Planes\s+in\s+hanger:\s+1/.test(element.textContent.replace(/\s+/g, ' ').trim());
    })).toBeInTheDocument();
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
