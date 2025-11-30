---
timestamp: 'Sun Nov 30 2025 11:06:29 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251130_110629.72c0b49d.md]]'
content_id: 429b0ca0ca7c955a77d39f9b8b4821403098677d03b9ea8bbd0d775c6019155d
---

# response:

An implementation of `grouping.sync.ts` requires creating synchronizations that map API requests to the actions and queries defined in the `Grouping` concept. This involves handling user authentication via `Sessioning`, authorization for admin-only actions, and processing data for query endpoints, including filtering based on the `Blocking` concept.

The following implementation provides a comprehensive set of API endpoints for group management, structured into action-based and query-based synchronizations.

### `src/syncs/grouping.sync.ts`

```typescript
import { actions, Frames, Sync } from "@engine";
import { Blocking, Grouping, Requesting, Sessioning } from "@concepts";

// =============================================================================
//  Group Creation
// =============================================================================

export const CreateGroupRequest: Sync = ({ session, name, user, request }) => ({
  when: actions([
    Requesting.request,
    { path: "/groups/create", session, name },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Grouping.createGroup, { name, admin: user }]),
});

export const CreateGroupResponse: Sync = ({ request, group }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/create" }, { request }],
    [Grouping.createGroup, {}, { group }],
  ),
  then: actions([Requesting.respond, { request, group }]),
});

export const CreateGroupResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/create" }, { request }],
    [Grouping.createGroup, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
//  Group Management (Admin Actions)
// =============================================================================

export const DeleteGroupRequest: Sync = ({ session, group, user, request, isAdmin }) => ({
  when: actions([
    Requesting.request,
    { path: "/groups/delete", session, group },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, { isAdmin });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.deleteGroup, { group }]),
});

export const DeleteGroupResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/delete" }, { request }],
    [Grouping.deleteGroup, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "ok" }]),
});

export const DeleteGroupResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/delete" }, { request }],
    [Grouping.deleteGroup, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const RenameGroupRequest: Sync = ({ session, group, newName, user, request, isAdmin }) => ({
  when: actions([
    Requesting.request,
    { path: "/groups/rename", session, group, newName },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, { isAdmin });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.renameGroup, { group, newName }]),
});

export const RenameGroupResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/rename" }, { request }],
    [Grouping.renameGroup, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "ok" }]),
});

export const RenameGroupResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/rename" }, { request }],
    [Grouping.renameGroup, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});


// =============================================================================
//  Join Requests
// =============================================================================

export const RequestToJoinGroupRequest: Sync = ({ session, group, user, request }) => ({
  when: actions([
    Requesting.request,
    { path: "/groups/request-join", session, group },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Grouping.requestToJoin, { group, requester: user }]),
});

export const RequestToJoinGroupResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/request-join" }, { request }],
    [Grouping.requestToJoin, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "ok" }]),
});

export const RequestToJoinGroupResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/request-join" }, { request }],
    [Grouping.requestToJoin, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const ConfirmRequestRequest: Sync = ({ session, group, requester, user, request, isAdmin }) => ({
  when: actions([
    Requesting.request,
    { path: "/groups/confirm-request", session, group, requester },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, { isAdmin });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.confirmRequest, { group, requester }]),
});

export const ConfirmRequestResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/confirm-request" }, { request }],
    [Grouping.confirmRequest, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "ok" }]),
});

export const ConfirmRequestResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/confirm-request" }, { request }],
    [Grouping.confirmRequest, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const DeclineRequestRequest: Sync = ({ session, group, requester, user, request, isAdmin }) => ({
  when: actions([
    Requesting.request,
    { path: "/groups/decline-request", session, group, requester },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, { isAdmin });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.declineRequest, { group, requester }]),
});

export const DeclineRequestResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/decline-request" }, { request }],
    [Grouping.declineRequest, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "ok" }]),
});

export const DeclineRequestResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/decline-request" }, { request }],
    [Grouping.declineRequest, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
//  Member Management (Admin Actions)
// =============================================================================

export const RemoveMemberRequest: Sync = ({ session, group, member, user, request, isAdmin }) => ({
  when: actions([
    Requesting.request,
    { path: "/groups/remove-member", session, group, member },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, { isAdmin });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.removeMember, { group, member }]),
});

export const RemoveMemberResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/remove-member" }, { request }],
    [Grouping.removeMember, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "ok" }]),
});

export const RemoveMemberResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/remove-member" }, { request }],
    [Grouping.removeMember, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const AdjustRoleRequest: Sync = ({ session, group, member, newRole, user, request, isAdmin }) => ({
  when: actions([
    Requesting.request,
    { path: "/groups/adjust-role", session, group, member, newRole },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, { isAdmin });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.adjustRole, { group, member, newRole }]),
});

export const AdjustRoleResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/adjust-role" }, { request }],
    [Grouping.adjustRole, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "ok" }]),
});

export const AdjustRoleResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/groups/adjust-role" }, { request }],
    [Grouping.adjustRole, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
//  Data Queries
// =============================================================================

export const ListMyGroups: Sync = ({ request, session, user, groups }) => ({
  when: actions([
    Requesting.request, { path: "/groups/mine", session }, { request }
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if(frames.length === 0) return new Frames(); // Invalid session

    // Query for groups. The output parameter is `group`, which contains an array `Group[]`.
    frames = await frames.query(Grouping._getUserGroups, { user }, { group: groups });

    if (frames.length === 0) {
      // User is in no groups. Reconstruct the frame with an empty array for the result.
      return new Frames({ ...originalFrame, [user]: (await Sessioning._getUser({session}))[0].user, [groups]: [] });
    }
    
    return frames;
  },
  then: actions([Requesting.respond, { request, groups }]),
});


/*
NOTE: The following query synchronizations (`ListGroupMembers`, `ListGroupAdmins`, `ListGroupJoinRequests`)
assume a modification to the `Grouping` concept's queries `_getMembers` and `_getAdmins` to return one 
result per user (e.g., `{ member: User }[]`) instead of a single result with an array of users. This
enables compositional filtering, such as checking for blocks on a per-user basis.
`_getRequests` already follows this preferred pattern.
*/
export const ListGroupMembers: Sync = ({ request, session, group, requestingUser, member, inGroup, isBlocked, members }) => ({
  when: actions([
    Requesting.request, { path: "/groups/members", session, group }, { request }
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user: requestingUser });
    if(frames.length === 0) return new Frames();

    frames = await frames.query(Grouping._isGroupMember, { group, user: requestingUser }, { inGroup });
    frames = frames.filter(($) => $[inGroup]);
    if(frames.length === 0) return new Frames(); // Not a member, fail silently.
    
    const authorizedFrame = frames[0];

    frames = await frames.query(Grouping._getMembers, { group }, { member });
    if (frames.length === 0) {
      return new Frames({ ...authorizedFrame, [members]: [] });
    }

    frames = await frames.query(Blocking._isUserBlocked, { primaryUser: member, secondaryUser: requestingUser }, { isBlocked });
    frames = frames.filter(($) => !$[isBlocked]);

    return frames.collectAs([member], members);
  },
  then: actions([Requesting.respond, { request, members }]),
});


export const ListGroupJoinRequests: Sync = ({ request, session, group, user, joinRequester, isAdmin, isBlocked, requests }) => ({
  when: actions([
    Requesting.request, { path: "/groups/requests", session, group }, { request }
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if(frames.length === 0) return new Frames();

    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, { isAdmin });
    frames = frames.filter(($) => $[isAdmin]);
    if(frames.length === 0) return new Frames();
    
    const authorizedFrame = frames[0];

    frames = await frames.query(Grouping._getRequests, { group }, { requestingUser: joinRequester });
    if (frames.length === 0) {
      return new Frames({ ...authorizedFrame, [requests]: [] });
    }

    frames = await frames.query(Blocking._isUserBlocked, { primaryUser: joinRequester, secondaryUser: user }, { isBlocked });
    frames = frames.filter(($) => !$[isBlocked]);

    return frames.collectAs([joinRequester], requests);
  },
  then: actions([Requesting.respond, { request, requests }]),
});

```
