import { supabase } from './supabase';

export const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * A global fetch wrapper configured to use the backend base URL.
 * It automatically prefixes routes with the correct API URL and
 * injects the current Supabase session token if available.
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // 1. Get the current session to extract the JWT
  const { data: { session } } = await supabase.auth.getSession();
  
  // 2. Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
    const error = await response.text();
    throw new Error(error || `API Error: ${response.status}`);
  }

  return response.json();
};

