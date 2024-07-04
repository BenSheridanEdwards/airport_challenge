import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import Airport from './Airport/Airport';

jest.mock('./Airport/Airport', () => {
  const originalModule = jest.requireActual('./Airport/Airport');
  let idCounter = 0;
  return {
    __esModule: true,
    ...originalModule,
    generateUniqueId: jest.fn(() => `test-plane-id-${idCounter++}`),
  };
});

describe('Airport', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5 (sunny)
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  it('should display the correct initial capacity and planes in hanger', async () => {
    render(<Airport />);
    expect(await screen.findByText('Capacity: 5')).toBeInTheDocument();
    expect(await screen.findByTestId('hanger-count')).toHaveTextContent('Planes in hanger: 0');
  });

  // Test case for landing a plane and updating the hanger
  it('should land a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    const message = await screen.findByText(/Plane landed successfully\./);
    expect(message).toBeInTheDocument();
    const hangerCount = await screen.findByTestId('hanger-count');
    expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
  });

  it('should take off a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    const message = await screen.findByText(/Plane landed successfully\./);
    expect(message).toBeInTheDocument();
    const hangerCount = await screen.findByTestId('hanger-count');
    expect(hangerCount).toHaveTextContent('Planes in hanger: 1');
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    const takeOffMessage = await screen.findByText(/Plane took off successfully\./);
    expect(takeOffMessage).toBeInTheDocument();
    const updatedHangerCount = await screen.findByTestId('hanger-count');
    expect(updatedHangerCount).toHaveTextContent('Planes in hanger: 0');
  });

  it('should display an error message when trying to land a plane in a full hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    for (let i = 0; i < 5; i++) {
      await userEvent.click(landButton);
      const hangerCount = await screen.findByTestId('hanger-count');
      await waitFor(() => expect(hangerCount).toHaveTextContent(new RegExp(`Planes\\s+in\\s+hanger:\\s*${i + 1}`)), { timeout: 5000 });
    }
    await userEvent.click(landButton);
    const errorMessage = await screen.findByText(/Hanger full, cannot land the plane!/);
    await waitFor(() => expect(errorMessage).toBeInTheDocument(), { timeout: 5000 });
  });

  it('should display an error message when trying to land a plane that is already in the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    const hangerCount = await screen.findByTestId('hanger-count');
    await waitFor(() => expect(hangerCount).toHaveTextContent('Planes in hanger: 1'), { timeout: 5000 });
    await userEvent.click(landButton);
    const errorMessage = await screen.findByText(/That plane is already here/);
    await waitFor(() => expect(errorMessage).toBeInTheDocument(), { timeout: 5000 });
  });

  it('should display an error message when trying to take off a plane during stormy weather', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    const hangerCount = await screen.findByTestId('hanger-count');
    await waitFor(() => expect(hangerCount).toHaveTextContent('Planes in hanger: 1'), { timeout: 5000 });
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0 (stormy)
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    const errorMessage = await screen.findByText(/Stormy weather, cannot take off the plane!/);
    await waitFor(() => expect(errorMessage).toBeInTheDocument(), { timeout: 5000 });
  });

  it('should display an error message when trying to take off a plane that is not in the hanger', async () => {
    render(<Airport />);
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    const errorMessage = await screen.findByText(/No planes available for takeoff/);
    expect(errorMessage).toBeInTheDocument();
  });

  it('should display a message when there are no planes available for takeoff', async () => {
    render(<Airport />);
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    expect(await screen.findByText(/No planes available for takeoff/)).toBeInTheDocument();
  });
});
