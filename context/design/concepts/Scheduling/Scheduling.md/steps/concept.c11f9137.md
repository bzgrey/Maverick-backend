---
timestamp: 'Thu Nov 13 2025 21:21:13 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251113_212113.c14227da.md]]'
content_id: c11f91373528c5fa23abfa2b2e3726b946a85cef667f50ea5b25c209c5dfbb10
---

# concept: Scheduling

**concept** Scheduling \[User, Event]

**purpose** enable users to organize events into schedules and identify potential conflicts between them

**principle** if a user creates two different schedules and adds events to both, comparing the two schedules will reveal any events that have overlapping times

**state**
a set of `Schedules` with
an `owner` User
a `name` String

a set of `ScheduledEvents` with
an `event` Event
a `schedule` Schedule
a `startTime` DateTime
a `endTime` DateTime

**actions**
createSchedule (owner: User, name: String): (schedule: Schedule)
**requires** no Schedule exists with the given `name` for the given `owner`
**effects** creates a new Schedule `s`; sets the owner of `s` to `owner` and name to `name`; returns `s` as `schedule`

createSchedule (owner: User, name: String): (error: String)
**requires** a Schedule already exists with the given `name` for the given `owner`
**effects** returns an error message

deleteSchedule (schedule: Schedule)
**requires** the given `schedule` exists
**effects** deletes the `schedule` and all `ScheduledEvents` associated with it

scheduleEvent (schedule: Schedule, event: Event, startTime: DateTime, endTime: DateTime): (scheduledEvent: ScheduledEvent)
**requires**
`schedule` exists
`startTime` is before `endTime`
**effects** creates a new ScheduledEvent `se`; sets the `schedule`, `event`, `startTime`, and `endTime` fields of `se` appropriately; returns `se` as `scheduledEvent`

scheduleEvent (schedule: Schedule, event: Event, startTime: DateTime, endTime: DateTime): (error: String)
**requires** `startTime` is not before `endTime`
**effects** returns an error message

unscheduleEvent (scheduledEvent: ScheduledEvent)
**requires** the given `scheduledEvent` exists
**effects** deletes the `scheduledEvent`

compareSchedules (schedule1: Schedule, schedule2: Schedule): (conflict: { event1: ScheduledEvent, event2: ScheduledEvent })
**requires** `schedule1` and `schedule2` both exist
**effects**
returns a set of `conflict` records
each `conflict` contains a pair of `ScheduledEvent`s, `event1` from `schedule1` and `event2` from `schedule2`
a pair is included if the time interval of `event1` overlaps with the time interval of `event2`
(specifically, if `event1.startTime` < `event2.endTime` AND `event2.startTime` < `event1.startTime`)

**queries**
\_getSchedulesForUser (owner: User): (schedule: Schedule)
**requires** `owner` exists
**effects** returns the set of all `Schedules` owned by `owner`

\_getEventsForSchedule (schedule: Schedule): (scheduledEvent: ScheduledEvent)
**requires** `schedule` exists
**effects** returns the set of all `ScheduledEvents` associated with `schedule`
