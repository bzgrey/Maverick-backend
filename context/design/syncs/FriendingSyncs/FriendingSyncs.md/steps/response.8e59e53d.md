---
timestamp: 'Tue Nov 18 2025 22:05:36 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251118_220536.1d717e99.md]]'
content_id: 8e59e53da1a5cb17fa6a1730c6b5f9411cc46635c021a085682e97cc982abbf3
---

# response:

Of course. Here are the synchronization specifications that connect the `Friending` and `Blocking` concepts with `CourseScheduling` and with each other.

***

### Friending Synchronizations

These synchronizations connect the concept of friendship to other features, like viewing or comparing schedules. They ensure that actions are only permitted between users who have a mutual friendship connection.

```sync
sync ViewFriendSchedule
when
    Requesting.request (path: "/schedules/view", viewer: user1, viewee: user2) : (request)
where
    in Friending: _areTheyFriends(user1, user2) is true
    in Blocking: _isUserBlocked(primaryUser: user2, secondaryUser: user1) is false
    in CourseScheduling: _getUserSchedule(user: user2) gets schedule
then
    Requesting.respond(request, schedule)
```

```sync
sync CompareScheduleWithFriend
when
    Requesting.request (path: "/schedules/compare", user1, user2) : (request)
where
    in Friending: _areTheyFriends(user1, user2) is true
    in Blocking: _isUserBlocked(primaryUser: user1, secondaryUser: user2) is false
    in Blocking: _isUserBlocked(primaryUser: user2, secondaryUser: user1) is false
    in CourseScheduling: _getScheduleComparison(user1, user2) gets commonEvents
then
    Requesting.respond(request, events: commonEvents)
```

```sync
sync ViewFriendScheduleErrorNotFriends
when
    Requesting.request (path: "/schedules/view", viewer: user1, viewee: user2) : (request)
where
    in Friending: _areTheyFriends(user1, user2) is false
then
    Requesting.respond(request, error: "Users are not friends.")
```

```sync
sync CompareScheduleWithFriendErrorNotFriends
when
    Requesting.request (path: "/schedules/compare", user1, user2) : (request)
where
    in Friending: _areTheyFriends(user1, user2) is false
then
    Requesting.respond(request, error: "Users are not friends.")
```

***

### Blocking Synchronizations

These synchronizations enforce the rules of the `Blocking` concept across the application. When a user is blocked, it should immediately sever any existing social connections and prevent future ones.

```sync
sync UnfriendOnBlock
when
    Blocking.blockUser (blocker, userToBlock)
where
    in Friending: _areTheyFriends(blocker, userToBlock) is true
then
    Friending.removeFriend (remover: blocker, removed: userToBlock)
```

```sync
sync RejectIncomingFriendRequestOnBlock
when
    Blocking.blockUser (blocker, userToBlock)
where
    in Friending: pending request from userToBlock to blocker exists
then
    Friending.rejectFriend (requester: userToBlock, requestee: blocker)
```

```sync
sync CancelOutgoingFriendRequestOnBlock
when
    Blocking.blockUser (blocker, userToBlock)
where
    in Friending: pending request from blocker to userToBlock exists
then
    Friending.rejectFriend (requester: blocker, requestee: userToBlock)
```

```sync
sync AutoRejectFriendRequestIfBlocked
when
    Friending.requestFriend (requester, requestee)
where
    in Blocking: _isUserBlocked(primaryUser: requestee, secondaryUser: requester) is true
then
    Friending.rejectFriend (requester, requestee)
```

```sync
sync BlockScheduleViewing
when
    Requesting.request (path: "/schedules/view", viewer: user1, viewee: user2) : (request)
where
    in Blocking: _isUserBlocked(primaryUser: viewee, secondaryUser: viewer) is true
then
    Requesting.respond(request, error: "This user has blocked you.")
```

```sync
sync BlockScheduleComparison
when
    Requesting.request (path: "/schedules/compare", user1, user2) : (request)
where
    in Blocking: _isUserBlocked(primaryUser: user1, secondaryUser: user2) is true or _isUserBlocked(primaryUser: user2, secondaryUser: user1) is true
then
    Requesting.respond(request, error: "Cannot compare schedules; a block is in place.")
```
