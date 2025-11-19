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