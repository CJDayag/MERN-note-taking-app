import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './login';
import { toast } from 'sonner';
import '@testing-library/jest-dom';

// Mock the toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string, children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock onLogin prop
const mockOnLogin = jest.fn().mockResolvedValue(true);

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    render(
      <MemoryRouter>
        <LoginPage onLogin={mockOnLogin} />
      </MemoryRouter>
    );
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  test('handles successful login and navigates to dashboard', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'test-token' }),
    });

    render(
      <MemoryRouter>
        <LoginPage onLogin={mockOnLogin} />
      </MemoryRouter>
    );
    
    fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), { 
      target: { value: 'test@example.com' } 
    });
    
    fireEvent.change(screen.getByPlaceholderText('Your password'), { 
      target: { value: 'password123' } 
    });
    
    fireEvent.click(screen.getByText('Sign in'));
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('You have been logged in successfully.');
      expect(mockOnLogin).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});