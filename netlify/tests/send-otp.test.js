import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../functions/send-otp.js';
import supabase from '../functions/utils/supabase.js';

// Mock the entire supabase client module
vi.mock('../functions/utils/supabase.js', () => {
  return {
    default: {
      auth: {
        signInWithOtp: vi.fn(),
      },
    },
  };
});

describe('send-otp handler', () => {

  beforeEach(() => {
    // Clear mock history before each test
    vi.clearAllMocks();
  });

  it('should return 405 if the http method is not POST', async () => {
    const event = { httpMethod: 'GET' };
    const response = await handler(event);
    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body).error).toBe('Method Not Allowed');
  });

  it('should return 400 for an invalid email address', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Invalid email');
  });

  it('should call Supabase with shouldCreateUser: true for a "signup"', async () => {
    supabase.auth.signInWithOtp.mockResolvedValue({ error: null });
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'test@example.com', purpose: 'signup' }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: { shouldCreateUser: true },
    });
    expect(JSON.parse(response.body).ok).toBe(true);
  });

  it('should call Supabase with shouldCreateUser: false for a "login"', async () => {
    supabase.auth.signInWithOtp.mockResolvedValue({ error: null });
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'test@example.com', purpose: 'login' }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: { shouldCreateUser: false },
    });
  });

  it('should return a 404 error if Supabase indicates a user is not found during login', async () => {
    const supabaseError = { message: 'User not found' };
    supabase.auth.signInWithOtp.mockResolvedValue({ error: supabaseError });
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com', purpose: 'login' }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Email not found. Please sign up first.');
  });

  it('should return a generic error for other Supabase errors', async () => {
    const supabaseError = { message: 'Something else went wrong' };
    supabase.auth.signInWithOtp.mockResolvedValue({ error: supabaseError });
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'test@example.com', purpose: 'signup' }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Failed to send OTP.');
  });
});
