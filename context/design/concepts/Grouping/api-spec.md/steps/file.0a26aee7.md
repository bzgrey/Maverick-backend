---
timestamp: 'Sun Nov 30 2025 11:46:30 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251130_114630.6b2fb6c4.md]]'
content_id: 0a26aee76a178bf73d16e27358f39f5ef75e67d190b14a13caae6b9a8ef8b8bd
---

# file: src/syncs/grouping.sync.ts

```typescript
import { actions, Frames, Sync } from "@engine";
import { Blocking, Grouping, Requesting, Sessioning } from "@concepts";

// =============================================================================
//  Group Creation
// =============================================================================

export const CreateGroupRequest: Sync = ({ session, name, user, request }) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/createGroup", session, name },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Grouping.createGroup, { name, admin: user }]),
});

export const CreateGroupResponse: Sync = ({ request, group }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/createGroup" }, { request }],
    [Grouping.createGroup, {}, { group }],
  ),
  then: actions([Requesting.respond, { request, group }]),
});

export const CreateGroupResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/createGroup" }, { request }],
    [Grouping.createGroup, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
//  Group Management (Admin Actions)
// =============================================================================

export const DeleteGroupRequest: Sync = (
  { session, group, user, request, isAdmin },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/deleteGroup", session, group },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, {
      isAdmin,
    });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.deleteGroup, { group }]),
});

export const DeleteGroupResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/deleteGroup" }, { request }],
    [Grouping.deleteGroup, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const DeleteGroupResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/deleteGroup" }, { request }],
    [Grouping.deleteGroup, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const RenameGroupRequest: Sync = (
  { session, group, newName, user, request, isAdmin },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/renameGroup", session, group, newName },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, {
      isAdmin,
    });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.renameGroup, { group, newName }]),
});

export const RenameGroupResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/renameGroup" }, { request }],
    [Grouping.renameGroup, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const RenameGroupResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/renameGroup" }, { request }],
    [Grouping.renameGroup, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
//  Join Requests
// =============================================================================

export const RequestToJoinGroupRequest: Sync = (
  { session, group, user, request },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/requestToJoin", session, group },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Grouping.requestToJoin, { group, requester: user }]),
});

export const RequestToJoinGroupResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/requestToJoin" }, { request }],
    [Grouping.requestToJoin, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const RequestToJoinGroupResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/requestToJoin" }, { request }],
    [Grouping.requestToJoin, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const ConfirmRequestRequest: Sync = (
  { session, group, requester, user, request, isAdmin },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/confirmRequest", session, group, requester },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, {
      isAdmin,
    });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.confirmRequest, { group, requester }]),
});

export const ConfirmRequestResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/confirmRequest" }, { request }],
    [Grouping.confirmRequest, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const ConfirmRequestResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/confirmRequest" }, { request }],
    [Grouping.confirmRequest, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const DeclineRequestRequest: Sync = (
  { session, group, requester, user, request, isAdmin },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/declineRequest", session, group, requester },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, {
      isAdmin,
    });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.declineRequest, { group, requester }]),
});

export const DeclineRequestResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/declineRequest" }, { request }],
    [Grouping.declineRequest, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const DeclineRequestResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/declineRequest" }, { request }],
    [Grouping.declineRequest, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
//  Member Management (Admin Actions)
// =============================================================================

export const RemoveMemberRequest: Sync = (
  { session, group, member, user, request, isAdmin },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/removeMember", session, group, member },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, {
      isAdmin,
    });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.removeMember, { group, member }]),
});

export const RemoveMemberResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/removeMember" }, { request }],
    [Grouping.removeMember, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const RemoveMemberResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/removeMember" }, { request }],
    [Grouping.removeMember, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const AdjustRoleRequest: Sync = (
  { session, group, member, newRole, user, request, isAdmin },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/adjustRole", session, group, member, newRole },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, {
      isAdmin,
    });
    return frames.filter(($) => $[isAdmin]);
  },
  then: actions([Grouping.adjustRole, { group, member, newRole }]),
});

export const AdjustRoleResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/adjustRole" }, { request }],
    [Grouping.adjustRole, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const AdjustRoleResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Grouping/adjustRole" }, { request }],
    [Grouping.adjustRole, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =============================================================================
//  Data Queries
// =============================================================================

export const ListMyGroups: Sync = ({ request, session, user, groups }) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/_getUserGroups", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) return new Frames(); // Invalid session

    // Query for groups. The output parameter is `group`, which contains an array `Group[]`.
    frames = await frames.query(Grouping._getUserGroups, { user }, {
      group: groups,
    });

    if (frames.length === 0) {
      // User is in no groups. Reconstruct the frame with an empty array for the result.
      return new Frames({
        ...originalFrame,
        [groups]: [],
      });
    }

    return frames;
  },
  then: actions([Requesting.respond, { request, groups }]),
});

export const ListGroupMembers: Sync = (
  {
    request,
    session,
    group,
    requestingUser,
    member,
    inGroup,
    isBlocked,
    members,
  },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/_getMembers", session, group },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, {
      user: requestingUser,
    });
    if (frames.length === 0) return new Frames();

    frames = await frames.query(Grouping._isGroupMember, {
      group,
      user: requestingUser,
    }, { inGroup });
    frames = frames.filter(($) => $[inGroup]);
    if (frames.length === 0) return new Frames(); // Not a member, fail silently.

    const authorizedFrame = frames[0];

    frames = await frames.query(Grouping._getMembers, { group }, { member });
    if (frames.length === 0) {
      return new Frames({ ...authorizedFrame, [members]: [] });
    }

    frames = await frames.query(Blocking._isUserBlocked, {
      primaryUser: member,
      secondaryUser: requestingUser,
    }, { isBlocked });
    frames = frames.filter(($) => !$[isBlocked]);

    return frames.collectAs([member], members);
  },
  then: actions([Requesting.respond, { request, members }]),
});

export const ListGroupJoinRequests: Sync = (
  {
    request,
    session,
    group,
    user,
    joinRequester,
    isAdmin,
    isBlocked,
    requests,
  },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/_getRequests", session, group },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) return new Frames();

    frames = await frames.query(Grouping._isGroupAdmin, { group, user }, {
      isAdmin,
    });
    frames = frames.filter(($) => $[isAdmin]);
    if (frames.length === 0) return new Frames();

    const authorizedFrame = frames[0];

    frames = await frames.query(Grouping._getRequests, { group }, {
      requestingUser: joinRequester,
    });
    if (frames.length === 0) {
      return new Frames({ ...authorizedFrame, [requests]: [] });
    }

    frames = await frames.query(Blocking._isUserBlocked, {
      primaryUser: joinRequester,
      secondaryUser: user,
    }, { isBlocked });
    frames = frames.filter(($) => !$[isBlocked]);

    return frames.collectAs([joinRequester], requests);
  },
  then: actions([Requesting.respond, { request, requests }]),
});

export const GetGroupByName: Sync = ({ request, name, group }) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/_getGroupByName", name },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Grouping._getGroupByName, { name }, { group });
    if (frames.length === 0) {
      // Group not found, create a response frame with a null group
      return new Frames({ ...originalFrame, [group]: null });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, group }]),
});

export const IsGroupMember: Sync = (
  { request, session, group, user, inGroup },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/_isGroupMember", session, group },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) return new Frames(); // Invalid session

    const userBoundFrame = frames[0];

    frames = await frames.query(
      Grouping._isGroupMember,
      { group, user },
      { inGroup },
    );
    if (frames.length === 0) {
      // Group doesn't exist, so user is not a member.
      return new Frames({ ...userBoundFrame, [inGroup]: false });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, inGroup }]),
});

export const IsGroupAdmin: Sync = (
  { request, session, group, user, isAdmin },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/_isGroupAdmin", session, group },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) return new Frames(); // Invalid session

    const userBoundFrame = frames[0];

    frames = await frames.query(
      Grouping._isGroupAdmin,
      { group, user },
      { isAdmin },
    );
    if (frames.length === 0) {
      // Group doesn't exist, so user is not an admin.
      return new Frames({ ...userBoundFrame, [isAdmin]: false });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, isAdmin }]),
});

export const GetGroupAdmins: Sync = (
  { request, session, group, user, inGroup, admins },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Grouping/_getAdmins", session, group },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) return new Frames(); // Invalid session

    // Security check: only members can see the admin list
    frames = await frames.query(
      Grouping._isGroupMember,
      { group, user },
      { inGroup },
    );
    frames = frames.filter(($) => $[inGroup]);
    if (frames.length === 0) return new Frames(); // Not a member or group doesn't exist

    const authorizedFrame = frames[0];

    frames = await frames.query(Grouping._getAdmins, { group }, { admins });
    if (frames.length === 0) {
      // This case should be rare if group exists, but we handle it by returning an empty list.
      return new Frames({ ...authorizedFrame, [admins]: [] });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, admins }]),
});

```
