import '@testing-library/jest-dom/extend-expect';

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

jest.setTimeout(60000);

beforeEach(() => {
});

afterEach(() => {
});