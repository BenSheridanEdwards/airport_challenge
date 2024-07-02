import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport';
import { isStormy } from '../Weather/Weather';

jest.mock('../Weather/Weather', () => ({
  isStormy: jest.fn(),
}));

describe('Airport Component', () => {
  beforeEach(() => {
    (isStormy as jest.Mock).mockReturnValue(false);
  });

  it('renders Airport component', () => {
    render(<Airport />);
    expect(screen.getByText('Airport')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 5')).toBeInTheDocument();
    expect(screen.getByText('Planes in hanger: 0')).toBeInTheDocument();
  });

  it('lands a plane successfully', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByText('Land Plane'));
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element !== null && element.textContent !== null && element.textContent.includes('Planes in hanger: 1') && element.tagName.toLowerCase() === 'p';
      })).toBeInTheDocument();
    });
  });

  it('prevents landing when hanger is full', async () => {
    render(<Airport />);
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByText('Land Plane'));
      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element !== null && element.textContent !== null && element.textContent.includes(`Planes in hanger: ${i + 1}`) && element.tagName.toLowerCase() === 'p';
        })).toBeInTheDocument();
      });
    }
    await userEvent.click(screen.getByText('Land Plane'));
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element !== null && element.textContent !== null && element.textContent.includes('Hanger full, abort landing!') && element.tagName.toLowerCase() === 'p';
      })).toBeInTheDocument();
    });
  });

  it('prevents landing when weather is stormy', async () => {
    (isStormy as jest.Mock).mockReturnValue(true);
    render(<Airport />);
    await userEvent.click(screen.getByText('Land Plane'));
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element !== null && element.textContent !== null && element.textContent.includes('Stormy weather, cannot land the plane!') && element.tagName.toLowerCase() === 'p';
      })).toBeInTheDocument();
    });
  });

  it('prevents landing when plane is already in hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByText('Land Plane');
    await userEvent.click(landButton);
    await userEvent.click(landButton);
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element !== null && element.textContent !== null && element.textContent.includes('That plane is already here') && element.tagName.toLowerCase() === 'p';
      })).toBeInTheDocument();
    });
  });

  it('takes off a plane successfully', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByText('Land Plane'));
    await userEvent.click(screen.getByText('Take Off Plane'));
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element !== null && element.textContent !== null && element.textContent.includes('Planes in hanger: 0') && element.tagName.toLowerCase() === 'p';
      })).toBeInTheDocument();
    });
  });

  it('prevents takeoff when weather is stormy', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByText('Land Plane'));
    (isStormy as jest.Mock).mockReturnValue(true);
    await userEvent.click(screen.getByText('Take Off Plane'));
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element !== null && element.textContent !== null && element.textContent.includes('Stormy weather, unable to take off!') && element.tagName.toLowerCase() === 'p';
      })).toBeInTheDocument();
    });
  });

  it('prevents takeoff when no planes are available', async () => {
    render(<Airport />);
    await userEvent.click(screen.getByText('Take Off Plane'));
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element !== null && element.textContent !== null && element.textContent.includes('No planes available for takeoff') && element.tagName.toLowerCase() === 'p';
      })).toBeInTheDocument();
    });
  });

  it('prevents takeoff when plane is not in hanger', async () => {
    render(<Airport />);
    const landButton = screen.getByText('Land Plane');
    const takeOffButton = screen.getByText('Take Off Plane');
    await userEvent.click(landButton);
    await userEvent.click(takeOffButton);
    await userEvent.click(takeOffButton);
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element !== null && element.textContent !== null && element.textContent.includes('That plane isn\'t here') && element.tagName.toLowerCase() === 'p';
      })).toBeInTheDocument();
    });
  });
});
