import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VerifyOTP from '@/pages/VerifyOTP';
import { apiCall } from '@/services/api';
import { toast } from 'sonner';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/services/api', () => ({
  apiCall: vi.fn(),
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/components/ui/NeuralBackground', () => ({
  default: () => <div data-testid="neural-bg" />,
}));

describe('VerifyOTP page suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('signupEmail', 'newstudent@smaart.edu');
    sessionStorage.setItem('signupTempToken', 'temp_signup_token_abc');
    apiCall.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('redirects to /signup-initial if required session credentials are missing', () => {
    sessionStorage.removeItem('signupEmail');
    sessionStorage.removeItem('signupTempToken');

    render(<VerifyOTP />);

    expect(toast.error).toHaveBeenCalledWith('Please start from signup');
    expect(mockNavigate).toHaveBeenCalledWith('/signup-initial');
  });

  it('renders verification UI and displays registered email when session data exists', () => {
    render(<VerifyOTP />);

    expect(screen.getByText('Two-Step Verification')).toBeInTheDocument();
    expect(screen.getByText('newstudent@smaart.edu')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText(/3:00/)).toBeInTheDocument();
  });

  it('cleans up session data and navigates to /signup-initial when clicking Back button', () => {
    sessionStorage.setItem('signupFullName', 'New Student');

    render(<VerifyOTP />);
    const backBtn = screen.getByRole('button', { name: /back/i });

    fireEvent.click(backBtn);

    expect(sessionStorage.getItem('signupEmail')).toBeNull();
    expect(sessionStorage.getItem('signupFullName')).toBeNull();
    expect(sessionStorage.getItem('signupTempToken')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/signup-initial');
  });

  it('restricts input to numbers only and limits length to 6 digits', () => {
    render(<VerifyOTP />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'abc1234567' } });

    expect(input).toHaveValue('123456');
  });

  it('shows error toast when attempting to submit with incomplete OTP (< 6 digits)', async () => {
    render(<VerifyOTP />);
    const input = screen.getByRole('textbox');
    const submitBtn = screen.getByRole('button', { name: /verify & proceed/i });

    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.click(submitBtn);

    expect(toast.error).toHaveBeenCalledWith('OTP must be 6 digits');
    expect(apiCall).not.toHaveBeenCalled();
  });

  it('submits valid OTP, updates storage, and navigates to /signup on success', async () => {
    apiCall.mockResolvedValue({
      success: true,
      message: 'Signup verified',
    });

    render(<VerifyOTP />);
    const input = screen.getByRole('textbox');
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: '654321' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledWith('/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken: 'temp_signup_token_abc',
          otp: '654321',
        }),
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('OTP verified successfully!');
      expect(sessionStorage.getItem('otpVerified')).toBe('true');
      expect(sessionStorage.getItem('signupTempToken')).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });
  });

  it('displays error toast when backend rejects verification code', async () => {
    apiCall.mockRejectedValue(new Error('Incorrect or expired verification code'));

    render(<VerifyOTP />);
    const input = screen.getByRole('textbox');
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: '111111' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Incorrect or expired verification code');
    });

    expect(sessionStorage.getItem('otpVerified')).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalledWith('/signup');
  });

  it('handles resend OTP request and updates tempToken in storage and state', async () => {
    apiCall.mockResolvedValueOnce({
      tempToken: 'updated_temp_token_999',
    });

    render(<VerifyOTP />);
    const resendBtn = screen.getByRole('button', { name: /send new code/i });

    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledWith('/auth/resend-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken: 'temp_signup_token_abc' }),
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('OTP resent to your email!');
      expect(sessionStorage.getItem('signupTempToken')).toBe('updated_temp_token_999');
    });
  });

  it('shows error toast when resending OTP fails', async () => {
    apiCall.mockRejectedValueOnce(new Error('Rate limit exceeded for resend'));

    render(<VerifyOTP />);
    const resendBtn = screen.getByRole('button', { name: /send new code/i });

    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Rate limit exceeded for resend');
    });
  });
});
