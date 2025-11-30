[@sync-implementation](../../background/implementing-synchronizations.md)

[@Grouping.sync.ts](../../../src/syncs/grouping.sync.ts)

[@GroupingConcepts](../../../src/concepts/Grouping/GroupingConcept.ts)

[@Grouping](Grouping.md)

[@SchedulingAPI.md](./SchedulingAPI.md)

[@SchedulingAPI.ts](./SchedulingAPI.ts)


# Prompt: Please write an appropriate GroupingAPI.md and GroupingAPI.ts, that references all of the syncs in grouping.sync.ts and the only two direct queries are _getGroups and _getGroupByName
# response:

Here are the `GroupingAPI.md` and `GroupingAPI.ts` files based on the provided context and your request.

# API Specification: Grouping Concept

**Purpose:** Manage the lifecycle of groups and their membership.

**Note:** All ID types (`User`, `Group`) are represented as strings.

***

## API Endpoints

### POST /api/Grouping/createGroup

**Description:** Creates a new group with the authenticated user as the first admin.

**Requirements:**

*   A group with the given `name` must not already exist.

**Effects:**

*   Creates a new `Group` with the authenticated user as the sole member and admin.
*   Returns the new `Group`'s identifier.

**Request Body:**

```json
{
  "session": "string",
  "name": "string"
}
```

**Success Response Body (Action):**

```json
{
  "group": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Grouping/deleteGroup

**Description:** Deletes a group.

**Requirements:**

*   The authenticated user (identified by `session`) must be an admin of the specified `group`.

**Effects:**

*   Deletes the `group`.

**Request Body:**

```json
{
  "session": "string",
  "group": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Grouping/renameGroup

**Description:** Renames a group.

**Requirements:**

*   The authenticated user must be an admin of the specified `group`.
*   No other group exists with `newName`.

**Effects:**

*   Updates the `name` of the `group` to `newName`.

**Request Body:**

```json
{
  "session": "string",
  "group": "string",
  "newName": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Grouping/requestToJoin

**Description:** The authenticated user requests to join a group.

**Requirements:**

*   The `group` must exist.
*   The authenticated user must not already be a member or have a pending request.

**Effects:**

*   Creates a pending join request for the user to the specified `group`.

**Request Body:**

```json
{
  "session": "string",
  "group": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Grouping/confirmRequest

**Description:** An admin confirms a user's request to join a group.

**Requirements:**

*   The authenticated user must be an admin of the `group`.
*   The `requester` must have a pending join request for the `group`.

**Effects:**

*   Adds the `requester` to the `group`'s members with the 'MEMBER' role.
*   Removes the pending join request.

**Request Body:**

```json
{
  "session": "string",
  "group": "string",
  "requester": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Grouping/declineRequest

**Description:** An admin declines a user's request to join a group.

**Requirements:**

*   The authenticated user must be an admin of the `group`.
*   The `requester` must have a pending join request for the `group`.

**Effects:**

*   Removes the pending join request.

**Request Body:**

```json
{
  "session": "string",
  "group": "string",
  "requester": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Grouping/removeMember

**Description:** An admin removes a member from a group.

**Requirements:**

*   The authenticated user must be an admin of the `group`.
*   The `member` must be a member of the `group`.
*   The `member` is not the last admin of the group.

**Effects:**

*   Removes the `member` from the `group`.

**Request Body:**

```json
{
  "session": "string",
  "group": "string",
  "member": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Grouping/adjustRole

**Description:** An admin changes the role of a group member.

**Requirements:**

*   The authenticated user must be an admin of the `group`.
*   The `member` must be a member of the `group`.
*   `newRole` must be either "ADMIN" or "MEMBER".

**Effects:**

*   Updates the `member`'s role in the `group` to `newRole`.

**Request Body:**

```json
{
  "session": "string",
  "group": "string",
  "member": "string",
  "newRole": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Grouping/_getUserGroups

**Description:** Retrieves all groups that the authenticated user is a member of.

**Request Body:**

```json
{
  "session": "string"
}
```

**Success Response Body (Query):**

```json
{
  "groups": ["string", "string"]
}
```

***

### POST /api/Grouping/_getMembers

**Description:** Retrieves all members of a specific group.

**Requirements:**

*   The authenticated user must be a member of the `group`.

**Effects:**

*   Returns a list of members, excluding users who have blocked the requesting user.

**Request Body:**

```json
{
  "session": "string",
  "group": "string"
}
```

**Success Response Body (Query):**

```json
{
  "members": [
    { "member": "string" },
    { "member": "string" }
  ]
}
```

***

### POST /api/Grouping/_getGroupRequests

**Description:** Retrieves all pending join requests for a group.

**Requirements:**

*   The authenticated user must be an admin of the `group`.

**Effects:**

*   Returns a list of users who have requested to join, excluding users who have blocked the requesting user.

**Request Body:**

```json
{
  "session": "string",
  "group": "string"
}
```

**Success Response Body (Query):**

```json
{
  "requests": [
    { "joinRequester": "string" },
    { "joinRequester": "string" }
  ]
}
```

***

### POST /api/Grouping/_getUserRequests

**Description:** Retrieves all groups that the authenticated user has requested to join.

**Requirements:**

*   The user must be authenticated via a valid session.

**Effects:**

*   Returns a list of groups that the user has pending join requests for.

**Request Body:**

```json
{
  "session": "string"
}
```

**Success Response Body (Query):**

```json
{
  "groups": [
    "string",
    "string"
  ]
}
```

***

### POST /api/Grouping/_getAdmins

**Description:** Retrieves all admins of a specific group.

**Requirements:**

*   The authenticated user must be a member of the `group`.

**Request Body:**

```json
{
  "session": "string",
  "group": "string"
}
```

**Success Response Body (Query):**

```json
{
  "admins": ["string", "string"]
}
```

***

### POST /api/Grouping/_isGroupMember

**Description:** Checks if the authenticated user is a member of a specific group.

**Request Body:**

```json
{
  "session": "string",
  "group": "string"
}
```

**Success Response Body (Query):**

```json
{
  "inGroup": true
}
```

***

### POST /api/Grouping/_isGroupAdmin

**Description:** Checks if the authenticated user is an admin of a specific group.

**Request Body:**

```json
{
  "session": "string",
  "group": "string"
}
```

**Success Response Body (Query):**

```json
{
  "isAdmin": false
}
```

***

### POST /api/Grouping/_getGroupByName

**Description:** Retrieves a group's ID by its name. This is a public query.

**Request Body:**

```json
{
  "name": "string"
}
```

**Success Response Body (Query):**

```json
{
  "group": "string"
}
```
**Note:** `group` will be `null` if no group with the given name is found.

***

### POST /api/Grouping/_getGroups

**Description:** Retrieves a list of all groups in the system. This is a public query.

**Request Body:**

```json
{}
```

**Success Response Body (Query):**

```json
{
  "groups": ["string", "string"]
}
```

***

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
    "/Grouping/_getGroupRequests",
    "/Grouping/_getUserRequests",
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