/**
 * Vitest global test setup.
 * Runs before every test file to register @testing-library/jest-dom
 * custom matchers (toBeInTheDocument, toHaveValue, etc.).
 */
import "@testing-library/jest-dom";
