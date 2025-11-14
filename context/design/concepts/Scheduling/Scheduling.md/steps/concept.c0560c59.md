---
timestamp: 'Thu Nov 13 2025 21:31:37 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251113_213137.21e7c690.md]]'
content_id: c0560c591e7c28d911f8f5a5303c286a8ac877d658f61bf506ae1515746b855a
---

# concept: Scheduling

* **concept**: Scheduling \[User, Event]

* **purpose**: Enable users to organize events into personal schedules and compare them to find common busy times.

* **principle**: If two users each create a schedule and add events representing their commitments, they can then compare their schedules to identify the time slots where they are both busy, facilitating the process of finding a mutual meeting time.

* **state**: A description of the state stored by the concept.

  ```
  a set of Users with
    a schedule Schedule

  a set of Schedules with
    a events set of Event

  a set of Events with
    a startTime Number // A point in time, e.g., Unix timestamp
    a endTime Number   // A point in time, e.g., Unix timestamp
  ```

* **actions**: The set of actions that can be performed.

  **`createSchedule (user: User): (schedule: Schedule)`**

  * **requires**: The given `user` does not already have a schedule.
  * **effects**: Creates a new, empty `Schedule` `s`; associates `s` with the `user`; returns the new `Schedule`'s identifier as `schedule`.

  **`createSchedule (user: User): (error: String)`**

  * **requires**: The given `user` already has a schedule.
  * **effects**: Returns an error message.

  **`createEvent (startTime: Number, endTime: Number): (event: Event)`**

  * **requires**: `startTime` is less than `endTime`.
  * **effects**: Creates a new `Event` `e`; sets the `startTime` and `endTime` of `e`; returns the new `Event`'s identifier as `event`.

  **`createEvent (startTime: Number, endTime: Number): (error: String)`**

  * **requires**: `startTime` is not less than `endTime`.
  * **effects**: Returns an error message indicating an invalid time interval.

  **`addEventToSchedule (user: User, event: Event)`**

  * **requires**: The `user` has a schedule; the `event` exists.
  * **effects**: Adds the `event` to the `user`'s schedule.

  **`addEventToSchedule (user: User, event: Event): (error: String)`**

  * **requires**: The `user` does not have a schedule, or the `event` does not exist.
  * **effects**: Returns an error message.

  **`removeEventFromSchedule (user: User, event: Event)`**

  * **requires**: The `user` has a schedule, and the `event` is in the `user`'s schedule.
  * **effects**: Removes the `event` from the `user`'s schedule.

  **`removeEventFromSchedule (user: User, event: Event): (error: String)`**

  * **requires**: The `user` does not have a schedule, or the `event` is not in the `user`s schedule.
  * **effects**: Returns an error message.

  **`deleteEvent (event: Event)`**

  * **requires**: The `event` exists.
  * **effects**: Removes the `event` from the set of all Events; removes the `event` from any Schedule that contains it.

  **`deleteEvent (event: Event): (error: String)`**

  * **requires**: The `event` does not exist.
  * **effects**: Returns an error message.

* **queries**: Reads of the concept state.

  **`_getEventsForUser (user: User): (event: {id: Event, startTime: Number, endTime: Number})`**

  * **requires**: The `user` has a schedule.
  * **effects**: Returns a set of all events in the user's schedule, where each event is a dictionary containing its identifier, start time, and end time.

  **`_getScheduleComparison (user1: User, user2: User): (overlap: {startTime: Number, endTime: Number})`**

  * **requires**: Both `user1` and `user2` have schedules.
  * **effects**: Calculates and returns a set of time intervals representing the periods where the schedules of `user1` and `user2` have overlapping events. An interval is defined by `startTime` and `endTime`. An overlap between two events `e1` (s1, t1) and `e2` (s2, t2) exists if `s1 < t2` and `s2 < t1`, and the resulting interval is `[max(s1, s2), min(t1, t2)]`.
