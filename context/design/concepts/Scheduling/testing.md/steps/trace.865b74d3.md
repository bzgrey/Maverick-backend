---
timestamp: 'Tue Nov 18 2025 17:12:05 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251118_171205.6175e37d.md]]'
content_id: 865b74d384fbb7b8bbf4e32bf071332104288d2771453af1ee481b88d26ac066
---

# trace:

The following trace describes how the **principle** of the `Scheduling` concept is fulfilled through a sequence of actions, as implemented in the test file above.

**Principle**: "If a user adds different events to their schedule, they can then compare schedules and see which events they have in common."

1. **`createSchedule(user: "user:Alice")`**: A schedule is created for the first user, Alice. The system now knows Alice can have events.
2. **`createSchedule(user: "user:Bob")`**: A schedule is created for the second user, Bob.
3. **`addEvent(event: "event:Math101", ...)`**: A general "Math 101" event is created and stored in the system's set of all possible events.
4. **`addEvent(event: "event:Hist202", ...)`**: A "History 202" event is created.
5. **`scheduleEvent(user: "user:Alice", event: "event:Math101")`**: The "Math 101" event is added to Alice's personal schedule.
6. **`scheduleEvent(user: "user:Bob", event: "event:Math101")`**: The same "Math 101" event is added to Bob's personal schedule. This is now a common event.
7. **`scheduleEvent(user: "user:Bob", event: "event:Hist202")`**: The "History 202" event is added only to Bob's schedule, making it unique to him.
8. **`_getUserSchedule(user: "user:Alice")`**: (Verification Step) A query confirms that Alice's schedule contains one event: `["event:Math101"]`.
9. **`_getUserSchedule(user: "user:Bob")`**: (Verification Step) A query confirms that Bob's schedule contains two events: `["event:Math101", "event:Hist202"]`.
10. **`_getScheduleComparison(user1: "user:Alice", user2: "user:Bob")`**: The core query of the principle is executed. The system compares the set of events in Alice's schedule with the set from Bob's schedule.
11. **`returns (events: ["event:Math101"])`**: The query successfully finds the intersection of the two schedules and returns only the common event, `"event:Math101"`, thus fulfilling the concept's principle.
