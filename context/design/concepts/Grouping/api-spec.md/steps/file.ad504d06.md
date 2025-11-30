---
timestamp: 'Sun Nov 30 2025 11:47:35 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251130_114735.c1d8b81e.md]]'
content_id: ad504d06b0be5ae96e250418f7b42335e4fbd77243b206d6d3cf29955de5d54d
---

# file: design/concepts/Grouping/GroupingAPI.ts

```typescript
import { apiCall } from "../api";
import { useAuthStore } from "@/stores/auth";

type Group = string;
type User = string;
type Role = "ADMIN" | "MEMBER";

/**
 * Grouping Concept API Functions
 * Based on API spec in GroupingAPI.md
 */

/**
 * Helper function to get the current session token from the auth store
 */
function getSessionToken(): string {
  const authStore = useAuthStore();
  const session = authStore.session;
  if (!session) {
    throw new Error("No active session. Please log in.");
  }
  return session;
}

/**
 * Creates a new group with the authenticated user as the first admin.
 * @param name - The name for the new group.
 */
export async function createGroup(name: string): Promise<{ group: Group }> {
  const session = getSessionToken();
  return (await apiCall(
    "/Grouping/createGroup",
    { session, name },
    "createGroup",
  )) as { group: Group };
}

/**
 * Deletes a group. Requires admin privileges.
 * @param group - The ID of the group to delete.
 */
export async function deleteGroup(
  group: Group,
): Promise<Record<string, never>> {
  const session = getSessionToken();
  return (await apiCall(
    "/Grouping/deleteGroup",
    { session, group },
    "deleteGroup",
  )) as Record<string, never>;
}

/**
 * Renames a group. Requires admin privileges.
 * @param group - The ID of the group to rename.
 * @param newName - The new name for the group.
 */
export async function renameGroup(
  group: Group,
  newName: string,
): Promise<Record<string, never>> {
  const session = getSessionToken();
  return (await apiCall(
    "/Grouping/renameGroup",
    { session, group, newName },
    "renameGroup",
  )) as Record<string, never>;
}

/**
 * The authenticated user requests to join a group.
 * @param group - The ID of the group to join.
 */
export async function requestToJoin(
  group: Group,
): Promise<Record<string, never>> {
  const session = getSessionToken();
  return (await apiCall(
    "/Grouping/requestToJoin",
    { session, group },
    "requestToJoin",
  )) as Record<string, never>;
}

/**
 * An admin confirms a user's request to join a group.
 * @param group - The ID of the group.
 * @param requester - The ID of the user whose request is being confirmed.
 */
export async function confirmRequest(
  group: Group,
  requester: User,
): Promise<Record<string, never>> {
  const session = getSessionToken();
  return (await apiCall(
    "/Grouping/confirmRequest",
    { session, group, requester },
    "confirmRequest",
  )) as Record<string, never>;
}

/**
 * An admin declines a user's request to join a group.
 * @param group - The ID of the group.
 * @param requester - The ID of the user whose request is being declined.
 */
export async function declineRequest(
  group: Group,
  requester: User,
): Promise<Record<string, never>> {
  const session = getSessionToken();
  return (await apiCall(
    "/Grouping/declineRequest",
    { session, group, requester },
    "declineRequest",
  )) as Record<string, never>;
}

/**
 * An admin removes a member from a group.
 * @param group - The ID of the group.
 * @param member - The ID of the member to remove.
 */
export async function removeMember(
  group: Group,
  member: User,
): Promise<Record<string, never>> {
  const session = getSessionToken();
  return (await apiCall(
    "/Grouping/removeMember",
    { session, group, member },
    "removeMember",
  )) as Record<string, never>;
}

/**
 * An admin changes the role of a group member.
 * @param group - The ID of the group.
 * @param member - The ID of the member whose role is being adjusted.
 * @param newRole - The new role for the member ("ADMIN" or "MEMBER").
 */
export async function adjustRole(
  group: Group,
  member: User,
  newRole: Role,
): Promise<Record<string, never>> {
  const session = getSessionToken();
  return (await apiCall(
    "/Grouping/adjustRole",
    { session, group, member, newRole },
    "adjustRole",
  )) as Record<string, never>;
}

/**
 * Retrieves all groups that the authenticated user is a member of.
 */
export async function getUserGroups(): Promise<Group[]> {
  const session = getSessionToken();
  const response = await apiCall(
    "/Grouping/_getUserGroups",
    { session },
    "getUserGroups",
  );
  return response.groups as Group[];
}

/**
 * Retrieves all members of a specific group. Requires membership.
 * @param group - The ID of the group.
 */
export async function getMembers(group: Group): Promise<{ member: User }[]> {
  const session = getSessionToken();
  const response = await apiCall(
    "/Grouping/_getMembers",
    { session, group },
    "getMembers",
  );
  return response.members as { member: User }[];
}

/**
 * Retrieves all pending join requests for a group. Requires admin privileges.
 * @param group - The ID of the group.
 */
export async function getJoinRequests(
  group: Group,
): Promise<{ joinRequester: User }[]> {
  const session = getSessionToken();
  const response = await apiCall(
    "/Grouping/_getRequests",
    { session, group },
    "getJoinRequests",
  );
  return response.requests as { joinRequester: User }[];
}

/**
 * Retrieves all admins of a specific group. Requires membership.
 * @param group - The ID of the group.
 */
export async function getAdmins(group: Group): Promise<User[]> {
  const session = getSessionToken();
  const response = await apiCall(
    "/Grouping/_getAdmins",
    { session, group },
    "getAdmins",
  );
  return response.admins as User[];
}

/**
 * Checks if the authenticated user is a member of a specific group.
 * @param group - The ID of the group.
 */
export async function isGroupMember(group: Group): Promise<boolean> {
  const session = getSessionToken();
  const response = await apiCall(
    "/Grouping/_isGroupMember",
    { session, group },
    "isGroupMember",
  );
  return response.inGroup as boolean;
}

/**
 * Checks if the authenticated user is an admin of a specific group.
 * @param group - The ID of the group.
 */
export async function isGroupAdmin(group: Group): Promise<boolean> {
  const session = getSessionToken();
  const response = await apiCall(
    "/Grouping/_isGroupAdmin",
    { session, group },
    "isGroupAdmin",
  );
  return response.isAdmin as boolean;
}

/**
 * Retrieves a group's ID by its name. Public query.
 * @param name - The name of the group.
 */
export async function getGroupByName(name: string): Promise<{ group: Group | null }> {
  return (await apiCall(
    "/Grouping/_getGroupByName",
    { name },
    "getGroupByName",
  )) as { group: Group | null };
}

/**
 * Retrieves a list of all groups. Public query.
 */
export async function getAllGroups(): Promise<Group[]> {
  // Assuming a sync exists for _getGroups as per the prompt
  const response = await apiCall(
    "/Grouping/_getGroups",
    {},
    "getAllGroups",
  );
  return response.groups as Group[];
}


// Export all functions as a bundle
export const GroupingAPI = {
  createGroup,
  deleteGroup,
  renameGroup,
  requestToJoin,
  confirmRequest,
  declineRequest,
  removeMember,
  adjustRole,
  getUserGroups,
  getMembers,
  getJoinRequests,
  getAdmins,
  isGroupMember,
  isGroupAdmin,
  getGroupByName,
  getAllGroups,
};
```
