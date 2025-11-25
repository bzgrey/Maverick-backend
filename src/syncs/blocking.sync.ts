import { actions, Frames, Sync } from "@engine";
import { Blocking, Requesting, Sessioning, UserAuthentication } from "@concepts";

// ============================================================================
// Block User
// ============================================================================

export const BlockUserRequest: Sync = ({ request, session, targetUsername, blocker, userToBlock }) => ({
  when: actions([Requesting.request, { path: "/blocking/block", session, targetUsername }, { request }]),
  where: async (frames: Frames) => {
    // Authenticate the requester
    frames = await frames.query(Sessioning._getUser, { session }, { user: blocker });
    if (frames.length === 0) {
      return new Frames();
    }

    // Lookup target user by username
    frames = await frames.query(UserAuthentication._getUserByUsername, { username: targetUsername }, { user: userToBlock });
    if (frames.length === 0) {
      return new Frames();
    }

    return frames;
  },
  then: actions([Blocking.blockUser, { blocker, userToBlock }]),
});

export const BlockUserResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/blocking/block" }, { request }],
    [Blocking.blockUser, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "blocked" }]),
});

export const BlockUserErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/blocking/block" }, { request }],
    [Blocking.blockUser, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const BlockUserQueryErrorResponse: Sync = ({ request, session, targetUsername, blocker, userToBlock, queryError }) => ({
  when: actions([Requesting.request, { path: "/blocking/block", session, targetUsername }, { request }]),
  where: async (frames: Frames) => {
    const originalFrame = frames[0];

    frames = await frames.query(Sessioning._getUser, { session }, { user: blocker });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [request]: originalFrame[request], [queryError]: "Invalid session" });
    }

    frames = await frames.query(UserAuthentication._getUserByUsername, { username: targetUsername }, { user: userToBlock });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [request]: originalFrame[request], [queryError]: "User not found" });
    }

    return new Frames();
  },
  then: actions([Requesting.respond, { request, error: queryError }]),
});

// ============================================================================
// Unblock User
// ============================================================================

export const UnblockUserRequest: Sync = ({ request, session, targetUsername, blocker, userToUnblock }) => ({
  when: actions([Requesting.request, { path: "/blocking/unblock", session, targetUsername }, { request }]),
  where: async (frames: Frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user: blocker });
    if (frames.length === 0) {
      return new Frames();
    }

    frames = await frames.query(UserAuthentication._getUserByUsername, { username: targetUsername }, { user: userToUnblock });
    if (frames.length === 0) {
      return new Frames();
    }

    return frames;
  },
  then: actions([Blocking.unblockUser, { blocker, userToUnblock }]),
});

export const UnblockUserResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/blocking/unblock" }, { request }],
    [Blocking.unblockUser, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "unblocked" }]),
});

export const UnblockUserErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/blocking/unblock" }, { request }],
    [Blocking.unblockUser, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const UnblockUserQueryErrorResponse: Sync = ({ request, session, targetUsername, blocker, userToUnblock, queryError }) => ({
  when: actions([Requesting.request, { path: "/blocking/unblock", session, targetUsername }, { request }]),
  where: async (frames: Frames) => {
    const originalFrame = frames[0];

    frames = await frames.query(Sessioning._getUser, { session }, { user: blocker });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [request]: originalFrame[request], [queryError]: "Invalid session" });
    }

    frames = await frames.query(UserAuthentication._getUserByUsername, { username: targetUsername }, { user: userToUnblock });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [request]: originalFrame[request], [queryError]: "User not found" });
    }

    return new Frames();
  },
  then: actions([Requesting.respond, { request, error: queryError }]),
});

// ============================================================================
// Get Blocked Users (Query)
// ============================================================================

export const GetBlockedUsersResponseSuccess: Sync = ({ request, session, user, blockedUser, blockedUsers }) => ({
  when: actions([Requesting.request, { path: "/Blocking/_blockedUsers", session }, { request }]),
  where: async (frames: Frames) => {
    const originalFrame = frames[0];

    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) {
      return new Frames();
    }

    frames = await frames.query(Blocking._blockedUsers, { user }, { user: blockedUser });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [request]: originalFrame[request], [blockedUsers]: [] });
    }

    return frames.collectAs([blockedUser], blockedUsers);
  },
  then: actions([Requesting.respond, { request, blockedUsers }]),
});

export const GetBlockedUsersResponseError: Sync = ({ request, session, user }) => ({
  when: actions([Requesting.request, { path: "/Blocking/_blockedUsers", session }, { request }]),
  where: async (frames: Frames) => {
    const originalFrame = frames[0];

    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [request]: originalFrame[request] });
    }

    return new Frames();
  },
  then: actions([Requesting.respond, { request, error: "Invalid session" }]),
});

// ============================================================================
// Is User Blocked (Query)
// ============================================================================

export const IsUserBlockedResponseSuccess: Sync = ({
  request,
  session,
  targetUsername,
  primaryUser,
  secondaryUser,
  result,
  isBlocked,
}) => ({
  when: actions([Requesting.request, { path: "/Blocking/_isUserBlocked", session, targetUsername }, { request }]),
  where: async (frames: Frames) => {
    const originalFrame = frames[0];

    frames = await frames.query(Sessioning._getUser, { session }, { user: primaryUser });
    if (frames.length === 0) {
      return new Frames();
    }

    frames = await frames.query(UserAuthentication._getUserByUsername, { username: targetUsername }, { user: secondaryUser });
    if (frames.length === 0) {
      return new Frames();
    }

    frames = await frames.query(Blocking._isUserBlocked, { primaryUser, secondaryUser }, { result });

    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [request]: originalFrame[request], [isBlocked]: false });
    }

    const mappedFrames = new Frames();
    for (const frame of frames) {
      const boolVal = (frame as Record<symbol, unknown>)[result] as boolean;
      mappedFrames.push({ ...frame, [isBlocked]: boolVal });
    }

    return mappedFrames;
  },
  then: actions([Requesting.respond, { request, isBlocked }]),
});

export const IsUserBlockedResponseError: Sync = ({ request, session, targetUsername, primaryUser, secondaryUser, queryError }) => ({
  when: actions([Requesting.request, { path: "/Blocking/_isUserBlocked", session, targetUsername }, { request }]),
  where: async (frames: Frames) => {
    const originalFrame = frames[0];

    frames = await frames.query(Sessioning._getUser, { session }, { user: primaryUser });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [request]: originalFrame[request], [queryError]: "Invalid session" });
    }

    frames = await frames.query(UserAuthentication._getUserByUsername, { username: targetUsername }, { user: secondaryUser });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [request]: originalFrame[request], [queryError]: "User not found" });
    }

    return new Frames();
  },
  then: actions([Requesting.respond, { request, error: queryError }]),
});
