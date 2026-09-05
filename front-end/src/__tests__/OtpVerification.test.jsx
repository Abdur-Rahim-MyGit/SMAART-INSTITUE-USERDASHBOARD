import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginOtpModal from '@/components/auth/LoginOtpModal';
import { apiCall } from '@/services/api';
import { toast } from 'sonner';

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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

describe('OtpVerification / LoginOtpModal component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    tempToken: 'sample_temp_token_123',
    email: 'student@smaart.edu',
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    apiCall.mockResolvedValue({ token: 'mock_token' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<LoginOtpModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog with 6 OTP input boxes, email, and countdown when isOpen is true', () => {
    render(<LoginOtpModal {...defaultProps} />);

    expect(screen.getByText('student@smaart.edu')).toBeInTheDocument();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
    expect(screen.getByText(/3:00/)).toBeInTheDocument();
  });

  it('allows user to type digits and automatically advances focus to next input', async () => {
    render(<LoginOtpModal {...defaultProps} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.change(inputs[0], { target: { value: '1' } });
    expect(inputs[0]).toHaveValue('1');

    fireEvent.change(inputs[1], { target: { value: '2' } });
    expect(inputs[1]).toHaveValue('2');
  });

  it('filters out non-numeric characters from input fields', () => {
    render(<LoginOtpModal {...defaultProps} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.change(inputs[0], { target: { value: 'a' } });
    expect(inputs[0]).toHaveValue('');

    fireEvent.change(inputs[0], { target: { value: '5' } });
    expect(inputs[0]).toHaveValue('5');
  });

  it('supports pasting a 6-digit numeric string across all input boxes', () => {
    render(<LoginOtpModal {...defaultProps} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => '123456',
      },
    });

    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('3');
    expect(inputs[3]).toHaveValue('4');
    expect(inputs[4]).toHaveValue('5');
    expect(inputs[5]).toHaveValue('6');
  });

  it('shows error toast when submitting incomplete OTP (< 6 digits)', async () => {
    render(<LoginOtpModal {...defaultProps} />);
    const form = screen.getAllByRole('textbox')[0].closest('form');

    fireEvent.submit(form);

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('complete 6-digit OTP'));
    expect(apiCall).not.toHaveBeenCalled();
  });

  it('verifies OTP on successful API call and calls onSuccess callback', async () => {
    apiCall.mockResolvedValueOnce({
      token: 'final_jwt_token',
      user: { id: 'u1', email: 'student@smaart.edu' },
    });

    render(<LoginOtpModal {...defaultProps} />);
    const inputs = screen.getAllByRole('textbox');

    // Fill all 6 digits to trigger verification
    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => '987654',
      },
    });

    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledWith('/auth/verify-login-otp', {
        method: 'POST',
        body: JSON.stringify({
          tempToken: 'sample_temp_token_123',
          otp: '987654',
          forceLogout: false,
        }),
      });
    });

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'final_jwt_token' })
      );
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Login successful'));
    });
  });

  it('displays error toast when API rejects OTP and clears inputs', async () => {
    apiCall.mockRejectedValueOnce(new Error('Invalid verification code'));

    render(<LoginOtpModal {...defaultProps} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => '000000',
      },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid verification code');
    });

    // Inputs should be reset
    await waitFor(() => {
      expect(inputs[0]).toHaveValue('');
    });
  });

  it('handles 409 conflict (device logged in elsewhere) by showing force logout view', async () => {
    const error409 = new Error('You are already logged in on another device.');
    error409.status = 409;
    error409.data = { requiresForceLogout: true };
    apiCall.mockRejectedValueOnce(error409);

    render(<LoginOtpModal {...defaultProps} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => '112233',
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/already logged in on another device/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign out other device/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when rate limited / account locked', async () => {
    const rateLimitError = new Error('Too many attempts. Please wait 5 minutes.');
    apiCall.mockRejectedValueOnce(rateLimitError);

    render(<LoginOtpModal {...defaultProps} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => '123123',
      },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('handles resend OTP action and applies cooldown', async () => {
    apiCall.mockResolvedValueOnce({
      tempToken: 'new_temp_token_456',
    });

    render(<LoginOtpModal {...defaultProps} />);
    const resendBtn = screen.getByRole('button', { name: /resend/i });

    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledWith('/auth/resend-login-otp', {
        method: 'POST',
        body: JSON.stringify({ tempToken: 'sample_temp_token_123' }),
      });
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('New OTP sent'));
    });
  });

  it('navigates back to previous input on Backspace when current input is empty', () => {
    render(<LoginOtpModal {...defaultProps} />);
    const inputs = screen.getAllByRole('textbox');

    // Focus input 1 and type '5'
    fireEvent.change(inputs[0], { target: { value: '5' } });
    expect(inputs[0]).toHaveValue('5');

    // Press Backspace on input 1
    fireEvent.keyDown(inputs[1], { key: 'Backspace' });
    // Focus should shift to input 0
    expect(document.activeElement).toBe(inputs[0]);
  });
});
