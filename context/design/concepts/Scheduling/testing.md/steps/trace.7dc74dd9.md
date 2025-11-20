---
timestamp: 'Thu Nov 20 2025 18:27:25 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251120_182725.53d0a365.md]]'
content_id: 7dc74dd911e79e14d08e1f9cdfac42d4ec6b46f4ea535b5e4e3be726e67f85fb
---

# trace:

The following trace demonstrates how the `Scheduling` concept fulfills its principle: "If a user adds different events to their schedule, they can then compare schedules and see which events they have in common."

1. **Setup**: Two users, Alice (`user:Alice`) and Bob (`user:Bob`), are part of the system.
2. **Alice creates a schedule**:
   * `Scheduling.createSchedule({ user: "user:Alice" })` is called.
   * **Result**: `{ schedule: "schedule:A" }`. A new, empty schedule is created and associated with Alice.
3. **Bob creates a schedule**:
   * `Scheduling.createSchedule({ user: "user:Bob" })` is called.
   * **Result**: `{ schedule: "schedule:B" }`. A new, empty schedule is created and associated with Bob.
4. **Alice populates her schedule**:
   * `Scheduling.scheduleEvent({ user: "user:Alice", event: "event:concert" })` is called.
   * `Scheduling.scheduleEvent({ user: "user:Alice", event: "event:meeting" })` is called.
   * **State Check**: A query `_getUserSchedule({ user: "user:Alice" })` would now return `["event:concert", "event:meeting"]`.
5. **Bob populates his schedule**:
   * `Scheduling.scheduleEvent({ user: "user:Bob", event: "event:meeting" })` is called.
   * `Scheduling.scheduleEvent({ user: "user:Bob", event: "event:dinner" })` is called.
   * **State Check**: A query `_getUserSchedule({ user: "user:Bob" })` would now return `["event:meeting", "event:dinner"]`.
6. **Comparison**: To find overlapping availability, a comparison query is run.
   * `Scheduling._getScheduleComparison({ user1: "user:Alice", user2: "user:Bob" })` is called.
   * **Result**: `["event:meeting"]`. The concept correctly identifies the single event that both users have in their schedules.
7. **Conclusion**: The trace successfully follows the principle, showing how users can create and populate schedules and then compare them to find common events, thereby fulfilling the concept's purpose.
