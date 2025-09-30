import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../functions/verify-otp.js';
import supabase from '../functions/utils/supabase.js';

// Mock the entire supabase client module
vi.mock('../functions/utils/supabase.js', () => {
  return {
    default: {
      auth: {
        verifyOtp: vi.fn(),
      },
    },
  };
});

describe('verify-otp handler', () => {

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
      body: JSON.stringify({ email: 'not-an-email', code: '123456' }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Invalid email');
  });

  it('should return 400 for an invalid code', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'test@example.com', code: '123' }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Invalid code');
  });

  it('should call Supabase with type: "email" for a "login"', async () => {
    const mockSession = { user: { id: '123' }, access_token: 'abc' };
    supabase.auth.verifyOtp.mockResolvedValue({ data: { session: mockSession }, error: null });

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'test@example.com', code: '123456', purpose: 'login' }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(supabase.auth.verifyOtp).toHaveBeenCalledTimes(1);
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      token: '123456',
      type: 'email',
    });
  });

  it('should call Supabase with type: "signup" for a "signup"', async () => {
    const mockSession = { user: { id: '123' }, access_token: 'abc' };
    supabase.auth.verifyOtp.mockResolvedValue({ data: { session: mockSession }, error: null });

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'test@example.com', code: '123456', purpose: 'signup' }),
    };

    await handler(event); // We just care about the call, not the response here

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      token: '123456',
      type: 'signup',
    });
  });

  it('should default to type: "email" when purpose is not provided', async () => {
    const mockSession = { user: { id: '123' }, access_token: 'abc' };
    supabase.auth.verifyOtp.mockResolvedValue({ data: { session: mockSession }, error: null });

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'test@example.com', code: '123456' }),
    };

    await handler(event);

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'email' })
    );
  });

  it('should return a 401 error if Supabase returns an error', async () => {
    const supabaseError = { message: 'Invalid token' };
    supabase.auth.verifyOtp.mockResolvedValue({ error: supabaseError });
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'test@example.com', code: '654321' }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).error).toBe('Incorrect or expired code.');
  });
});