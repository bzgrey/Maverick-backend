/**
 * API Service for ConceptBox
 * All endpoints use POST method as per API specification
 */

import { logger } from './logger';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiResponse {
  error?: string;
  [key: string]: any;
}

/**
 * Base fetch wrapper with error handling and logging
 */
export async function apiCall(
  endpoint: string,
  body: Record<string, any> = {},
  context: string = 'API Call'
): Promise<ApiResponse> {
  const url = `${API_BASE}${endpoint}`;

  logger.info(context, `Calling ${endpoint}`, { body });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      // API error response with error status code
      const errorMessage = data.error || 'Unknown error occurred';
      logger.error(context, errorMessage, {
        endpoint,
        status: response.status,
        body
      });
      throw new Error(errorMessage);
    }

    // Check if the response data contains an error field even with 200 OK
    if (data.error) {
      const errorMessage = data.error;
      logger.error(context, errorMessage, {
        endpoint,
        status: response.status,
        body
      });
      throw new Error(errorMessage);
    }

    logger.success(context, `Success from ${endpoint}`, { data });
    return data;

  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      logger.error(context, 'Network error - cannot reach server', {
        endpoint,
        error: error.message
      });
      throw new Error('Network error - cannot reach server');
    }
    throw error;
  }
}

/**
 * Blocking Concept API Functions
 * Based on API spec in blocking-api-generation.md and implementation in BlockingConcept.ts
 *
 * Note: The concept server creates endpoints based on method names from BlockingConcept.ts.
 * If the backend uses different endpoint names than the spec, these will need to be adjusted.
 */

/**
 * Allows the authenticated user to block a specific target by username.
 * API Spec: POST /api/blocking/block
 * Sync implementation: uses session + targetUsername to look up user IDs
 * @param session - Session token of the authenticated user
 * @param targetUsername - Username of the user to block
 * @returns Empty object on success, throws error on failure
 */
export async function blockUser(session: string, targetUsername: string): Promise<Record<string, never>> {
  return await apiCall(
    '/api/blocking/block',
    { session, targetUsername },
    'blockUser'
  ) as Record<string, never>;
}

/**
 * Allows the authenticated user to unblock a previously blocked target.
 * API Spec: POST /api/blocking/unblock
 * Sync implementation: uses session + targetUsername to look up user IDs
 * @param session - Session token of the authenticated user
 * @param targetUsername - Username of the user to unblock
 * @returns Empty object on success, throws error on failure
 */
export async function unblockUser(session: string, targetUsername: string): Promise<Record<string, never>> {
  return await apiCall(
    '/api/blocking/unblock',
    { session, targetUsername },
    'unblockUser'
  ) as Record<string, never>;
}

/**
 * Checks if the authenticated user has blocked a specific target.
 * API Spec: POST /api/Blocking/_isUserBlocked
 * Sync implementation: uses session + targetUsername
 * @param session - Session token of the authenticated user
 * @param targetUsername - Username of the user to check against the block list
 * @returns Object containing isBlocked boolean
 */
export async function isUserBlocked(session: string, targetUsername: string): Promise<{ isBlocked: boolean }> {
  const response = await apiCall(
    '/api/Blocking/_isUserBlocked',
    { session, targetUsername },
    'isUserBlocked'
  );
  return response as { isBlocked: boolean };
}

/**
 * Retrieves the list of usernames that the authenticated user has blocked.
 * API Spec: POST /api/Blocking/_blockedUsers
 * Sync implementation: uses session authentication
 * @param session - Session token of the authenticated user
 * @returns Array of user IDs representing blocked users
 */
export async function getBlockedUsers(session: string): Promise<string[]> {
  const response = await apiCall(
    '/api/Blocking/_blockedUsers',
    { session },
    'getBlockedUsers'
  );
  return response as string[];
}
