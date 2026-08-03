/**
 * Neo4j queries are handled by the backend API.
 * The frontend should NOT connect directly to Neo4j.
 * Use the backend routes (/api/v1/trust-score, etc.) instead.
 *
 * This file is kept as a placeholder to avoid breaking imports
 * while the codebase is being migrated to the decoupled architecture.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * @deprecated Use apiFetch from lib/api.ts instead.
 * Kept here to avoid breaking existing component imports.
 */
export const runCypher = async (_query: string, _params: Record<string, unknown> = {}) => {
  console.warn('runCypher() is deprecated. Use the backend API via apiFetch() instead.');
  return [];
};

export { API_BASE };

