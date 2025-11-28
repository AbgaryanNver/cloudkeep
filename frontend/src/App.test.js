import { render, screen } from '@testing-library/react';
import App from './App';

describe('CloudKeep Frontend', () => {
  test('renders CloudKeep header', () => {
    render(<App />);
    const headerElement = screen.getByText(/CloudKeep/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders upload button', () => {
    render(<App />);
    const uploadButton = screen.getByText(/Upload File/i);
    expect(uploadButton).toBeInTheDocument();
  });

  test('renders your files section', () => {
    render(<App />);
    const filesSection = screen.getByText(/Your Files/i);
    expect(filesSection).toBeInTheDocument();
  });

  test('renders empty state when no files', () => {
    render(<App />);
    const emptyMessage = screen.getByText(/No files yet/i);
    expect(emptyMessage).toBeInTheDocument();
  });

  test('renders footer', () => {
    render(<App />);
    const footerElement = screen.getByText(/CloudKeep v1.0.0/i);
    expect(footerElement).toBeInTheDocument();
  });
});
