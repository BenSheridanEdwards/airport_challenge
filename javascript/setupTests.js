// setupTests.js
import '@testing-library/jest-dom/extend-expect';
import { ToastContainer } from 'react-toastify';

// Mock react-toastify
jest.mock('react-toastify', () => {
  console.log('Mocking react-toastify');
  return {
    toast: jest.fn(),
    ToastContainer: jest.fn(() => null),
  };
});