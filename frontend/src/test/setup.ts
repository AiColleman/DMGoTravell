import '@testing-library/jest-dom/vitest';

// Mock de scrollTo en jsdom
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true,
});
