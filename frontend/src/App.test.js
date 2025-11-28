import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock fetch API
global.fetch = jest.fn();

describe('CloudKeep Frontend', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockClear();
    // Mock successful but empty response
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ files: [] })
    });
  });

  test('renders CloudKeep header', async () => {
    render(<App />);
    const headerElement = screen.getByText(/CloudKeep/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders upload button', async () => {
    render(<App />);
    const uploadButton = screen.getByText(/Upload File/i);
    expect(uploadButton).toBeInTheDocument();
  });

  test('renders your files section', async () => {
    render(<App />);
    await waitFor(() => {
      const filesSection = screen.getByText(/Your Files \(0\)/i);
      expect(filesSection).toBeInTheDocument();
    });
  });

  test('renders empty state when no files', async () => {
    render(<App />);
    await waitFor(() => {
      const emptyMessage = screen.getByText(/No files yet/i);
      expect(emptyMessage).toBeInTheDocument();
    });
  });

  test('renders footer', async () => {
    render(<App />);
    const footerElement = screen.getByText(/CloudKeep v1.0.0/i);
    expect(footerElement).toBeInTheDocument();
  });

  test('calls API on mount', async () => {
    render(<App />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/files'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-user-id': 'demo-user'
          })
        })
      );
    });
  });
});
