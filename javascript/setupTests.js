// setupTests.js
console.log('setupTests.js is being executed');

import '@testing-library/jest-dom/extend-expect';

// Mock react-toastify with more detailed functions
jest.mock('react-toastify', () => {
  const mockToast = jest.fn();
  return {
    toast: {
      error: mockToast,
      success: mockToast,
      info: mockToast,
      warn: mockToast,
      dismiss: jest.fn(),
      isActive: jest.fn(),
    },
    ToastContainer: jest.fn(() => null),
  };
});

// Set a global timeout for async operations
jest.setTimeout(60000);

// Add any necessary global setup or teardown operations
beforeEach(() => {
  console.log('Global beforeEach hook executed');
  // Global setup for each test if necessary
});

afterEach(() => {
  console.log('Global afterEach hook executed');
  // Global teardown for each test if necessary
});