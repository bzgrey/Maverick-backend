[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

# test: Scheduling


# response:

An implementation of the tests for the `Scheduling` concept.

# file: src/concepts/Scheduling/SchedulingConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import SchedulingConcept from "./SchedulingConcept.ts";

// Define some reusable test data
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const userCharlie = "user:Charlie" as ID; // User without a schedule

const eventMath = "event:Math101" as ID;
const eventHistory = "event:Hist202" as ID;
const eventArt = "event:Art303" as ID;
const eventNonExistent = "event:DoesNotExist" as ID;

const mathTime = { days: ["Monday", "Wednesday", "Friday"], startTime: "10:00", endTime: "11:00" };
const historyTime = { days: ["Tuesday", "Thursday"], startTime: "14:00", endTime: "15:30" };
const artTime = { days: ["Monday"], startTime: "13:00", endTime: "16:00" };

Deno.test("SchedulingConcept", async (t) => {
  const [db, client] = await testDb();
  const scheduling = new SchedulingConcept(db);

  await t.step("Action: createSchedule", async (t) => {
    await t.step("should create a new schedule for a user who does not have one", async () => {
      console.log("  - Testing successful schedule creation for Alice");
      const result = await scheduling.createSchedule({ user: userAlice });
      assertNotEquals(result, { error: "User already has a schedule." });
      assertExists((result as { schedule: ID }).schedule);
    });

    await t.step("should fail to create a schedule if one already exists for the user", async () => {
      console.log("  - Testing failed schedule creation for Alice (duplicate)");
      const result = await scheduling.createSchedule({ user: userAlice });
      assertEquals(result, { error: "User already has a schedule." });
    });
  });

  await t.step("Action: addEvent", async (t) => {
    await t.step("should add a new event to the collection", async () => {
      console.log("  - Testing successful creation of Math event");
      const result = await scheduling.addEvent({ event: eventMath, name: "Math 101", type: "Lecture", time: mathTime });
      assertEquals(result, {});
      const fromDb = await db.collection("Scheduling.events").findOne({ _id: eventMath });
      assertEquals(fromDb?.name, "Math 101");
    });

    await t.step("should fail to add an event if the ID already exists", async () => {
      console.log("  - Testing failed creation of Math event (duplicate ID)");
      const result = await scheduling.addEvent({ event: eventMath, name: "Duplicate Math", type: "Lecture", time: mathTime });
      assertEquals(result, { error: "Event with this ID already exists." });
    });
  });

  await t.step("Action: scheduleEvent", async (t) => {
    // Setup Bob's schedule for this test
    await scheduling.createSchedule({ user: userBob });

    await t.step("should add an existing event to a user's schedule", async () => {
      console.log("  - Testing scheduling Math for Bob");
      const result = await scheduling.scheduleEvent({ user: userBob, event: eventMath });
      assertEquals(result, {});

      const schedule = await scheduling._getUserSchedule({ user: userBob });
      assertEquals(schedule.length, 1);
      assertEquals(schedule[0].event, eventMath);
    });

    await t.step("should fail if the user does not have a schedule", async () => {
      console.log("  - Testing scheduling for Charlie (no schedule)");
      const result = await scheduling.scheduleEvent({ user: userCharlie, event: eventMath });
      assertEquals(result, { error: "User does not have a schedule." });
    });

    await t.step("should fail if the event does not exist", async () => {
      console.log("  - Testing scheduling a non-existent event for Bob");
      const result = await scheduling.scheduleEvent({ user: userBob, event: eventNonExistent });
      assertEquals(result, { error: "Event not found." });
    });
  });

  await t.step("Action: unscheduleEvent", async (t) => {
    await t.step("should remove an event from a user's schedule", async () => {
      console.log("  - Testing unscheduling Math from Bob");
      const result = await scheduling.unscheduleEvent({ user: userBob, event: eventMath });
      assertEquals(result, {});
      const schedule = await scheduling._getUserSchedule({ user: userBob });
      assertEquals(schedule.length, 0);
    });

    await t.step("should fail if the event is not in the user's schedule", async () => {
      console.log("  - Testing unscheduling Math from Bob again (should fail)");
      const result = await scheduling.unscheduleEvent({ user: userBob, event: eventMath });
      assertEquals(result, { error: "Event is not in the user's schedule." });
    });
  });

  await t.step("Action: removeEvent", async (t) => {
    // Setup: Create a new event and add it to a schedule
    await scheduling.addEvent({ event: eventArt, name: "Art 303", type: "Studio", time: artTime, user: userAlice });
    await scheduling.scheduleEvent({ user: userAlice, event: eventArt });

    let aliceSchedule = await scheduling._getUserSchedule({ user: userAlice });
    assertEquals(aliceSchedule.length, 1, "Pre-condition failed: Art event not in Alice's schedule");

    await t.step("should fail if user is not the owner", async () => {
      console.log("  - Testing Bob removing Alice's owned event (should fail)");
      const result = await scheduling.removeEvent({ event: eventArt, user: userBob });
      assertEquals(result, { error: "User is not authorized to remove this event." });
    });

    await t.step("should remove an event from the collection and cascade delete from schedules", async () => {
      console.log("  - Testing Alice removing her own event (should succeed and cascade)");
      const result = await scheduling.removeEvent({ event: eventArt, user: userAlice });
      assertEquals(result, {});

      // Verify it's gone from the events collection
      const fromDb = await db.collection("Scheduling.events").findOne({ _id: eventArt });
      assertEquals(fromDb, null);

      // Verify it was removed from Alice's schedule
      aliceSchedule = await scheduling._getUserSchedule({ user: userAlice });
      assertEquals(aliceSchedule.length, 0);
    });
  });

  await t.step("Principle Test: Comparing schedules", async () => {
    console.log("\n--- Testing the Core Principle ---");
    // 1. Setup: Users Alice and Bob have schedules.
    // Alice's schedule was created earlier. Bob's schedule was created earlier.
    console.log("1. Alice and Bob have schedules.");

    // 2. Setup: Add common and unique events.
    await scheduling.addEvent({ event: eventHistory, name: "History 202", type: "Seminar", time: historyTime });
    await scheduling.scheduleEvent({ user: userAlice, event: eventMath }); // Math is common
    await scheduling.scheduleEvent({ user: userBob, event: eventMath }); // Math is common
    await scheduling.scheduleEvent({ user: userBob, event: eventHistory }); // History is unique to Bob
    console.log("2. Added Math (common) and History (unique to Bob) events to schedules.");

    // 3. Verify schedules individually.
    const aliceSchedule = await scheduling._getUserSchedule({ user: userAlice });
    const bobSchedule = await scheduling._getUserSchedule({ user: userBob });
    assertEquals(aliceSchedule.length, 1);
    assertEquals(aliceSchedule[0].event, eventMath);
    assertEquals(bobSchedule.length, 2);
    assertEquals(bobSchedule.map((e) => e.event).sort(), [eventHistory, eventMath].sort());
    console.log("3. Verified Alice's schedule has [Math] and Bob's has [Math, History].");

    // 4. Compare schedules to find common events.
    const comparisonResult = await scheduling._getScheduleComparison({ user1: userAlice, user2: userBob });
    console.log("4. Comparing schedules for Alice and Bob...");

    // 5. Assert the result.
    assertEquals(comparisonResult.length, 1);
    assertExists(comparisonResult[0].events);
    assertEquals(comparisonResult[0].events, [eventMath]);
    console.log(`5. Success! Common event found: ${comparisonResult[0].events[0]}`);
    console.log("--- Principle Test Passed ---\n");
  });

  await client.close();
});
```

# trace:

The following trace describes how the **principle** of the `Scheduling` concept is fulfilled through a sequence of actions, as implemented in the test file above.

**Principle**: "If a user adds different events to their schedule, they can then compare schedules and see which events they have in common."

1.  **`createSchedule(user: "user:Alice")`**: A schedule is created for the first user, Alice. The system now knows Alice can have events.
2.  **`createSchedule(user: "user:Bob")`**: A schedule is created for the second user, Bob.
3.  **`addEvent(event: "event:Math101", ...)`**: A general "Math 101" event is created and stored in the system's set of all possible events.
4.  **`addEvent(event: "event:Hist202", ...)`**: A "History 202" event is created.
5.  **`scheduleEvent(user: "user:Alice", event: "event:Math101")`**: The "Math 101" event is added to Alice's personal schedule.
6.  **`scheduleEvent(user: "user:Bob", event: "event:Math101")`**: The same "Math 101" event is added to Bob's personal schedule. This is now a common event.
7.  **`scheduleEvent(user: "user:Bob", event: "event:Hist202")`**: The "History 202" event is added only to Bob's schedule, making it unique to him.
8.  **`_getUserSchedule(user: "user:Alice")`**: (Verification Step) A query confirms that Alice's schedule contains one event: `["event:Math101"]`.
9.  **`_getUserSchedule(user: "user:Bob")`**: (Verification Step) A query confirms that Bob's schedule contains two events: `["event:Math101", "event:Hist202"]`.
10. **`_getScheduleComparison(user1: "user:Alice", user2: "user:Bob")`**: The core query of the principle is executed. The system compares the set of events in Alice's schedule with the set from Bob's schedule.
11. **`returns (events: ["event:Math101"])`**: The query successfully finds the intersection of the two schedules and returns only the common event, `"event:Math101"`, thus fulfilling the concept's principle.