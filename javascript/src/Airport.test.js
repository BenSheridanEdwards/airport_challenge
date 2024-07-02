import { render, screen, cleanup } from '@testing-library/react';
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
    await screen.findByText((content, element) => content.includes('Capacity: 5'));
    await screen.findByText((content, element) => content.includes('Planes in hanger: 0'));
  });

  // Test case for landing a plane and updating the hanger
  it('should land a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    await screen.findByText((content, element) => content.includes('Planes in hanger: 1'));
  });

  // Test case for taking off a plane and updating the hanger
  it('should take off a plane and update the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    await screen.findByText((content, element) => content.includes('Planes in hanger: 1'));
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    await screen.findByText((content, element) => content.includes('Planes in hanger: 0'));
  });

  // Test case for displaying an error message when trying to land a plane in a full hanger
  it('should display an error message when trying to land a plane in a full hanger', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5 (sunny)
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    for (let i = 0; i < 5; i++) {
      await userEvent.click(landButton);
      await screen.findByText((content, element) => content.includes(`Planes in hanger: ${i + 1}`));
    }
    await userEvent.click(landButton);
    await screen.findByText((content, element) => content.includes('Hanger full, abort landing!'));
  });

  // Test case for displaying an error message when trying to land a plane during stormy weather
  it('should display an error message when trying to land a plane during stormy weather', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0 (stormy)
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    await screen.findByText((content, element) => content.includes('Stormy weather, cannot land the plane!'));
    expect(screen.getByText((content, element) => content.includes('Stormy weather, cannot land the plane!'))).toBeInTheDocument();
  });

  // Test case for displaying an error message when trying to take off a plane during stormy weather
  it('should display an error message when trying to take off a plane during stormy weather', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Mock Math.random to return 0.5 (sunny)
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    await screen.findByText((content, element) => content.includes('Planes in hanger: 1'));
    jest.spyOn(Math, 'random').mockReturnValue(0); // Mock Math.random to return 0 (stormy)
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    await screen.findByText((content, element) => content.includes('Stormy weather, unable to take off!'));
    expect(screen.getByText((content, element) => content.includes('Stormy weather, unable to take off!'))).toBeInTheDocument();
  });

  // Test case for displaying an error message when trying to land a plane that is already in the hanger
  it('should display an error message when trying to land a plane that is already in the hanger', async () => {
    render(<Airport />);
    const landButton = await screen.findByRole('button', { name: /Land Plane/i });
    await userEvent.click(landButton);
    await screen.findByText((content, element) => content.includes('Planes in hanger: 1'));
    await userEvent.click(landButton);
    await screen.findByText((content, element) => content.includes('That plane is already here'));
  });

  // Test case for displaying an error message when trying to take off a plane that is not in the hanger
  it('should display an error message when trying to take off a plane that is not in the hanger', async () => {
    render(<Airport />);
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    await screen.findByText((content, element) => content.includes('No planes available for takeoff'));
  });

  // Test case for displaying a message when there are no planes available for takeoff
  it('should display a message when there are no planes available for takeoff', async () => {
    render(<Airport />);
    const takeOffButton = await screen.findByRole('button', { name: /Take Off Plane/i });
    await userEvent.click(takeOffButton);
    await screen.findByText((content, element) => content.includes('No planes available for takeoff'));
  });
});
