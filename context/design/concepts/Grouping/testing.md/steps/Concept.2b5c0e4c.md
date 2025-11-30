---
timestamp: 'Sun Nov 30 2025 10:03:39 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251130_100339.f763dfbf.md]]'
content_id: 2b5c0e4c6dd49897203f05a9f5621737b5bb7b1525dbd2b109951e602dab7b91
---

# Concept: Grouping

* **Principle:** A `user` can create a `group` to organize other `users`. The creator automatically becomes the first `admin` of the group. Admins are responsible for managing the group's membership, which includes adding new members, removing existing members, and changing member roles. To preserve administrative control, a group must always have at least one admin. Only an admin can delete the entire group.

* **State:**
  * `groups`: A collection of groups, each with a unique ID, name, and description.
  * `group_members`: A linking table that associates users with groups, assigning them a specific `role` (e.g., 'admin', 'member').

* **Actions:**
  * `create({ creatorId, name, description })`: A user creates a new group.
    * **requires**: `creatorId` must belong to an existing user. `name` must be a non-empty string.
    * **effects**: A new record is added to `groups`. A new record is added to `group_members`, making the `creatorId` an 'admin' of the new group. Returns the new group record.
  * `addMember({ actorId, groupId, userId, role })`: An admin adds a new member to a group.
    * **requires**: `actorId` must be an 'admin' of the `groupId`. `userId` must not already be a member of the `groupId`. `groupId` and `userId` must exist.
    * **effects**: A new record is added to `group_members` for the `userId` with the specified `role` (defaults to 'member'). Returns the new membership record.
  * `removeMember({ actorId, groupId, userId })`: An admin removes a member from a group.
    * **requires**: `actorId` must be an 'admin' of the `groupId`. `userId` must be a member of the `groupId`. Cannot remove the last 'admin' from the group.
    * **effects**: The corresponding record in `group_members` is deleted. Returns the deleted membership record.
  * `updateRole({ actorId, groupId, userId, newRole })`: An admin changes a member's role.
    * **requires**: `actorId` must be an 'admin' of the `groupId`. `userId` must be a member of the `groupId`. Cannot change the role of the last 'admin' to a non-admin role.
    * **effects**: The `role` in the corresponding `group_members` record is updated to `newRole`. Returns the updated membership record.
  * `delete({ actorId, groupId })`: An admin deletes a group.
    * **requires**: `actorId` must be an 'admin' of the `groupId`.
    * **effects**: The group record from `groups` and all associated membership records from `group_members` are deleted. Returns the deleted group record.
