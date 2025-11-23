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
 * Allows a user to block a specific target.
 * API Spec: POST /api/Blocking/block
 * Implementation: blockUser method expects { blocker, userToBlock }
 * @param user - The user who is blocking (from API spec)
 * @param target - The target being blocked (from API spec)
 * @returns Empty object on success, throws error on failure
 */
export async function blockUser(user: string, target: string): Promise<Record<string, never>> {
  return await apiCall(
    '/api/Blocking/blockUser',
    { blocker: user, userToBlock: target },
    'blockUser'
  ) as Record<string, never>;
}

/**
 * Allows a user to unblock a previously blocked target.
 * API Spec: POST /api/Blocking/unblock
 * Implementation: unblockUser method expects { blocker, userToUnblock }
 * @param user - The user who is unblocking (from API spec)
 * @param target - The target being unblocked (from API spec)
 * @returns Empty object on success, throws error on failure
 */
export async function unblockUser(user: string, target: string): Promise<Record<string, never>> {
  return await apiCall(
    '/api/Blocking/unblockUser',
    { blocker: user, userToUnblock: target },
    'unblockUser'
  ) as Record<string, never>;
}

/**
 * Checks if a user has blocked a specific target.
 * API Spec: POST /api/Blocking/_isBlocked
 * Implementation: _isUserBlocked method expects { primaryUser, secondaryUser }
 * Note: The API spec returns { isBlocked: boolean }[] but implementation returns { result: boolean }[]
 * @param user - The user to check (from API spec)
 * @param target - The target to check (from API spec)
 * @returns Array with single object containing isBlocked boolean
 */
export async function isUserBlocked(user: string, target: string): Promise<{ isBlocked: boolean }[]> {
  const response = await apiCall(
    '/api/Blocking/_isUserBlocked',
    { primaryUser: user, secondaryUser: target },
    'isUserBlocked'
  );
  // Map implementation response { result: boolean }[] to API spec format { isBlocked: boolean }[]
  const result = response as { result: boolean }[];
  return result.map((item) => ({ isBlocked: item.result }));
}

/**
 * Retrieves a list of all targets that a user has blocked.
 * API Spec: POST /api/Blocking/_getBlocked
 * Implementation: _blockedUsers method expects { user }
 * Note: The API spec returns { target: Target }[] but implementation returns { user: User }[]
 * @param user - The user whose blocked list to retrieve
 * @returns Array of objects containing target IDs
 */
export async function getBlockedUsers(user: string): Promise<{ target: string }[]> {
  const response = await apiCall(
    '/api/Blocking/_blockedUsers',
    { user },
    'getBlockedUsers'
  );
  // Map implementation response { user: User }[] to API spec format { target: Target }[]
  const result = response as { user: string }[];
  return result.map((item) => ({ target: item.user }));
}
