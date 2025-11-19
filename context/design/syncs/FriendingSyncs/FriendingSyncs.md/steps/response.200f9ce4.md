---
timestamp: 'Tue Nov 18 2025 22:10:38 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251118_221038.2a41f4a8.md]]'
content_id: 200f9ce450712b10cd1d5ec20374075bd2a2fff2c44cab31f9386f89c0f622ea
---

# response:

Here are the TypeScript implementations for the synchronizations that handle viewing user schedules based on friendship, group membership, and blocking status. These synchronizations are designed to be placed in a file such as `src/syncs/ScheduleViewing.sync.ts`.

This solution implements the required logic by splitting it into three distinct, mutually exclusive synchronizations: one for the success case, and two for specific error conditions. This ensures that for any given request to view a schedule, exactly one response is sent.

**Note:** This implementation assumes the `Grouping` concept has a query `_getGroupsForUser(user: User): (group: Group)` that returns all groups a given user is a member of. This is a reasonable and necessary query for this logic to be implemented efficiently in a declarative style.

### `src/syncs/ScheduleViewing.sync.ts`

```typescript
import { actions, Sync, Frames } from "@engine";
import {
  Requesting,
  CourseScheduling,
  Friending,
  Grouping,
  Blocking,
} from "@concepts";

/**
 * Responds with a user's schedule if the requesting user has permission.
 * Permission is granted if:
 * - The viewing user is not blocked by the user whose schedule is being requested.
 * - AND either:
 *   - The two users are friends.
 *   - OR the two users are in the same group.
 */
export const ViewSchedule: Sync = ({
  request,
  viewer,
  viewee,
  schedule,
  isBlocked,
  areFriends,
  group,
  member,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/schedules/view", viewer, viewee },
    { request },
  ]),
  where: async (frames) => {
    // 1. Filter out requests where the viewer is blocked by the viewee. This is a hard requirement.
    frames = await frames.query(
      Blocking._isUserBlocked,
      { primaryUser: viewee, secondaryUser: viewer },
      { isBlocked },
    );
    const allowedFrames = frames.filter(($) => $[isBlocked] === false);

    if (allowedFrames.length === 0) {
      return new Frames(); // No requests are allowed, handled by ViewScheduleBlocked sync.
    }

    // 2. Path A: Identify frames where the users are friends.
    const friendFrames = await allowedFrames
      .query(
        Friending._areTheyFriends,
        { user1: viewer, user2: viewee },
        { areFriends },
      )
      .then((f) => f.filter(($) => $[areFriends] === true));

    // 3. Path B: Identify frames where users share a group.
    // NOTE: Assumes `Grouping` concept has a `_getGroupsForUser(user: User): (group: Group)` query.
    const groupFrames = await allowedFrames
      .query(Grouping._getGroupsForUser, { user: viewer }, { group }) // Get all groups for the viewer
      .then((f) => f.query(Grouping._getMembers, { group }, { member })) // For each group, get all members
      .then((f) => f.filter(($) => $[member] === $[viewee])); // Keep only frames where the viewee is a member

    // 4. Combine and deduplicate the frames. We only want to respond once per request.
    const successfulFrames = new Frames(...friendFrames, ...groupFrames);
    const frameMap = new Map();
    for (const frame of successfulFrames) {
      if (!frameMap.has(frame[request])) {
        frameMap.set(frame[request], frame);
      }
    }
    const finalFrames = new Frames(...frameMap.values());

    // 5. If any frames remain, query for the schedule information to include in the response.
    if (finalFrames.length > 0) {
      return await finalFrames.query(
        CourseScheduling._getUserSchedule,
        { user: viewee },
        { schedule },
      );
    }

    return new Frames(); // No permissions found, handled by ViewScheduleNotPermitted sync.
  },
  then: actions([Requesting.respond, { request, schedule }]),
});

/**
 * Responds with a "blocked" error when a user tries to view the schedule of someone who has blocked them.
 */
export const ViewScheduleBlocked: Sync = ({
  request,
  viewer,
  viewee,
  isBlocked,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/schedules/view", viewer, viewee },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(
      Blocking._isUserBlocked,
      { primaryUser: viewee, secondaryUser: viewer },
      { isBlocked },
    );
    return frames.filter(($) => $[isBlocked] === true);
  },
  then: actions([
    Requesting.respond,
    { request, error: "This user has blocked you." },
  ]),
});

/**
 * Responds with a generic permission error if a user is not blocked, but is also not
 * a friend or in a shared group with the user whose schedule they are trying to view.
 */
export const ViewScheduleNotPermitted: Sync = ({
  request,
  viewer,
  viewee,
  isBlocked,
  areFriends,
  group,
  member,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/schedules/view", viewer, viewee },
    { request },
  ]),
  where: async (frames) => {
    // 1. Must NOT be blocked.
    frames = await frames.query(
      Blocking._isUserBlocked,
      { primaryUser: viewee, secondaryUser: viewer },
      { isBlocked },
    );
    let potentialFrames = frames.filter(($) => $[isBlocked] === false);
    if (potentialFrames.length === 0) return new Frames(); // Blocked case is handled by another sync.

    // 2. Must NOT be friends.
    potentialFrames = await potentialFrames.query(
      Friending._areTheyFriends,
      { user1: viewer, user2: viewee },
      { areFriends },
    );
    potentialFrames = potentialFrames.filter(($) => $[areFriends] === false);
    if (potentialFrames.length === 0) return new Frames(); // Friends case is handled by the success sync.

    // 3. Must NOT be in a shared group.
    // We check for a shared group and only keep the frames that *failed* this check.
    const groupCheckFrames = await potentialFrames
      .query(Grouping._getGroupsForUser, { user: viewer }, { group })
      .then((f) => f.query(Grouping._getMembers, { group }, { member }))
      .then((f) => f.filter(($) => $[member] === $[viewee]));

    const requestsWithGroupAccess = new Set(
      groupCheckFrames.map((f) => f[request]),
    );

    return potentialFrames.filter(
      (f) => !requestsWithGroupAccess.has(f[request]),
    );
  },
  then: actions([
    Requesting.respond,
    { request, error: "You do not have permission to view this schedule." },
  ]),
});
```
