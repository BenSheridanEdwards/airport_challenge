import { render, screen, cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport/Airport';

// Set global timeout for all tests
jest.setTimeout(10000);

describe('Airport', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  it('should display the correct initial capacity and planes in hanger', async () => {
    render(<Airport />);
    await waitFor(() => {
      expect(screen.getByText('Capacity: 5')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Planes in hanger: 0')).toBeInTheDocument();
    });
  });

  it('should land a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    expect(await screen.findByText(/Planes\s+in\s+hanger:\s*1/)).toBeInTheDocument();
  });

  it('should take off a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    expect(await screen.findByText(/Planes\s+in\s+hanger:\s*1/)).toBeInTheDocument();
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    expect(await screen.findByText(/Planes\s+in\s+hanger:\s*0/)).toBeInTheDocument();
  });

  it('should display an error message when trying to land a plane in a full hanger', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5 (sunny)
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    for (let i = 0; i < 5; i++) {
      await userEvent.click(landButton);
      const parent = screen.getByTestId(`hanger-${i + 1}`);
      expect(within(parent).getByText(new RegExp(`Planes\\s+in\\s+hanger:\\s*${i + 1}`))).toBeInTheDocument();
    }
    await userEvent.click(landButton);
    expect(await screen.findByText(/Hanger\s+full,\s+abort\s+landing!/)).toBeInTheDocument();
  });

  it('should display an error message when trying to land a plane during stormy weather', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0 (stormy)
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    expect(await screen.findByText(/Stormy\s+weather,\s+cannot\s+land\s+the\s+plane!/)).toBeInTheDocument();
  });

  it('should display an error message when trying to take off a plane during stormy weather', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    expect(await screen.findByText(/Planes\s+in\s+hanger:\s*1/)).toBeInTheDocument();
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0 (stormy)
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    expect(await screen.findByText(/Stormy\s+weather,\s+unable\s+to\s+take\s+off!/)).toBeInTheDocument();
  });

  it('should display an error message when trying to land a plane that is already in the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    expect(await screen.findByText(/Planes\s+in\s+hanger:\s*1/)).toBeInTheDocument();
    await userEvent.click(landButton);
    expect(await screen.findByText(/That\s+plane\s+is\s+already\s+here/)).toBeInTheDocument();
  });

  it('should display an error message when trying to take off a plane that is not in the hanger', async () => {
    render(<Airport />);
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    expect(await screen.findByText(/No\s+planes\s+available\s+for\s+takeoff/)).toBeInTheDocument();
  });

  it('should display a message when there are no planes available for takeoff', async () => {
    render(<Airport />);
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    expect(await screen.findByText(/No\s+planes\s+available\s+for\s+takeoff/)).toBeInTheDocument();
  });
});
