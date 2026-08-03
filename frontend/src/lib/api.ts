import { supabase } from './supabase';

export const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trust-layers-backend.onrender.com/api/v1';

/**
 * A global fetch wrapper configured to use the backend base URL.
 * It automatically prefixes routes with the correct API URL and
 * injects the current Supabase session token if available.
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // 1. Get the current session to extract the JWT
  const { data: { session } } = await supabase.auth.getSession();
  
  // 2. Prepare headers
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  // 3. Inject Authorization header if session exists
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  // 4. Ensure the endpoint starts with a slash and is lowercase
  const path = endpoint.startsWith('/') ? endpoint.toLowerCase() : `/${endpoint.toLowerCase()}`;
  
  const response = await fetch(`${VITE_API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const err = await response.json();
      throw new Error(err.message || err.error || `API Error: ${response.status}`);
    } else {
      // Server returned HTML (e.g. Express 404 page) — don't show raw HTML
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Server returned non-JSON response. Please make sure the backend server is running and configured correctly.');
  }

  return response.json();
};

