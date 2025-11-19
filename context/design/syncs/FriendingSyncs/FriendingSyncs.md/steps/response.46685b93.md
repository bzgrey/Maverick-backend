---
timestamp: 'Tue Nov 18 2025 22:12:07 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251118_221207.d75be444.md]]'
content_id: 46685b93632793bb1af7a8324d0a460c5758366227c1ce14ff0e7a5e61b17c7b
---

# response:

Of course. Here are the updated synchronization specifications to handle schedule viewing permissions based on friendship, group membership, and blocking status.

These specifications are broken down into four distinct, mutually exclusive rules to cover every possible outcome: two for success cases (friendship or shared group) and two for failure cases (blocked or insufficient permissions). This ensures that for any request to view a schedule, exactly one of the defined responses will occur.

**Note:** The logic for checking shared group membership assumes that a query `_getGroupsForUser(user: User): (group: Group)` exists on the `Grouping` concept. This query would return all groups that a given user is a member of, which is a standard and necessary function for this type of check.

***

### Schedule Viewing Synchronizations

These synchronizations manage the logic for when a user attempts to view another user's course schedule.

```sync
sync ViewScheduleAsFriend
when
    Requesting.request (path: "/schedules/view", viewer, viewee) : (request)
where
    in Blocking: _isUserBlocked(primaryUser: viewee, secondaryUser: viewer) is false
    in Friending: _areTheyFriends(user1: viewer, user2: viewee) is true
    in CourseScheduling: _getUserSchedule(user: viewee) gets schedule
then
    Requesting.respond(request, schedule)
```

```sync
sync ViewScheduleAsGroupMember
when
    Requesting.request (path: "/schedules/view", viewer, viewee) : (request)
where
    in Blocking: _isUserBlocked(primaryUser: viewee, secondaryUser: viewer) is false
    in Friending: _areTheyFriends(user1: viewer, user2: viewee) is false
    in Grouping: _getGroupsForUser(user: viewer) gets group
    in Grouping: _getMembers(group) gets member where member is viewee
    in CourseScheduling: _getUserSchedule(user: viewee) gets schedule
then
    Requesting.respond(request, schedule)
```

```sync
sync ViewScheduleBlockedError
when
    Requesting.request (path: "/schedules/view", viewer, viewee) : (request)
where
    in Blocking: _isUserBlocked(primaryUser: viewee, secondaryUser: viewer) is true
then
    Requesting.respond(request, error: "This user has blocked you.")
```

```sync
sync ViewSchedulePermissionDeniedError
when
    Requesting.request (path: "/schedules/view", viewer, viewee) : (request)
where
    in Blocking: _isUserBlocked(primaryUser: viewee, secondaryUser: viewer) is false
    in Friending: _areTheyFriends(user1: viewer, user2: viewee) is false
    NOT EXISTS group WHERE
        in Grouping: _getGroupsForUser(user: viewer) gets group AND
        in Grouping: _getMembers(group) gets member where member is viewee
then
    Requesting.respond(request, error: "You do not have permission to view this schedule.")
```
