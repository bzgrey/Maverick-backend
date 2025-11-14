---
timestamp: 'Thu Nov 13 2025 21:27:19 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251113_212719.5aefc680.md]]'
content_id: fc7521956335decb1fede2c154f9915d148c2e0bf152f7a3af9add631ac13da0
---

# concept: Scheduling

**concept** Scheduling \[User, Content]

**purpose** To allow users to manage their time by creating schedules of events and to identify conflicts between schedules.

**principle** If one user adds several events with specific times to their schedule, and another user does the same, they can then compare their schedules to find all time slots where both users have conflicting events, enabling them to find mutually available times.

**state**

```
a set of Users with
  a schedule Schedule

a set of Schedules with
  a events set of ScheduledEvent

a set of ScheduledEvents with
  a content Content
  a startTime DateTime
  a endTime DateTime
```

**actions**

```
createScheduleForUser (user: User): (schedule: Schedule)
```

* **requires** `user` does not already have a schedule.
* **effects** Creates a new, empty `Schedule` `s`; associates `s` with `user`; returns `s` as `schedule`.

```
createScheduleForUser (user: User): (error: String)
```

* **requires** `user` already has a schedule.
* **effects** Returns an error message.

```
addEvent (user: User, content: Content, startTime: DateTime, endTime: DateTime): (event: ScheduledEvent)
```

* **requires** `user` has a schedule; `startTime` is before `endTime`.
* **effects** Creates a new `ScheduledEvent` `e` with the given `content`, `startTime`, and `endTime`; adds `e` to the set of events for the user's schedule; returns `e` as `event`.

```
addEvent (user: User, content: Content, startTime: DateTime, endTime: DateTime): (error: String)
```

* **requires** `user` does not have a schedule, or `startTime` is not before `endTime`.
* **effects** Returns an error message.

```
removeEvent (event: ScheduledEvent)
```

* **requires** `event` exists in some user's schedule.
* **effects** The `ScheduledEvent` `event` is removed from the schedule it belongs to and is deleted from the set of all `ScheduledEvent`s.

```
updateEvent (event: ScheduledEvent, content: Content, startTime: DateTime, endTime: DateTime)
```

* **requires** `event` exists; `startTime` is before `endTime`.
* **effects** Updates the `content`, `startTime`, and `endTime` of `event` to the new values provided.

```
clearSchedule (user: User)
```

* **requires** `user` has a schedule.
* **effects** Removes all `ScheduledEvent`s from the schedule associated with `user`.

```
compareSchedules (user1: User, user2: User): (overlap: {startTime: DateTime, endTime: DateTime})
```

* **requires** Both `user1` and `user2` have schedules.
* **effects** Computes all time intervals where an event in `user1`'s schedule overlaps with an event in `user2`'s schedule; returns each such overlapping interval as a separate `overlap` result.

**queries**

```
_getScheduleForUser (user: User) : (schedule: Schedule)
```

* **requires** `user` has a schedule.
* **effects** Returns the `Schedule` associated with `user`.

```
_getEventsInSchedule (schedule: Schedule) : (event: ScheduledEvent, content: Content, startTime: DateTime, endTime: DateTime)
```

* **requires** `schedule` exists.
* **effects** Returns all `ScheduledEvent`s that are part of the given `schedule`, along with their associated `content`, `startTime`, and `endTime`.
