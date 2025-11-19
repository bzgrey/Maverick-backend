[@concept-background](../../tools/concept-background.md)

[@Scheduling](Scheduling.md)
# implement: Scheduling
implement the scheduling concept
# response:

An implementation of the `Scheduling` concept as a TypeScript class, designed to run on Deno and interact with a MongoDB database.

# file: src/concepts/Scheduling/SchedulingConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// --- Generic type parameters ---
type User = ID;
type Event = ID;
type Schedule = ID;

// --- Custom types from specification ---

/**
 * A structure for defining when an event occurs.
 * @property days - An array of weekdays, e.g., ["Tuesday", "Thursday"]
 * @property startTime - The start time in string format, e.g., "10:00"
 * @property endTime - The end time in string format, e.g., "11:30"
 */
interface MeetingTime {
  days: string[];
  startTime: string;
  endTime: string;
}

// --- State representation (MongoDB collection interfaces) ---

/**
 * a set of Schedules with
 *   a user User
 *   a set of Events
 */
interface ScheduleDoc {
  _id: Schedule;
  user: User;
  events: Event[];
}

/**
 * a set of Events with
 *   a name String
 *   a type String
 *   a MeetingTime
 *   an optional user User
 */
interface EventDoc {
  _id: Event;
  name: string;
  type: string;
  time: MeetingTime;
  user?: User; // Optional owner of the event
}

const PREFIX = "Scheduling" + ".";

/**
 * @concept Scheduling
 * @purpose Track events in one's schedule and compare with others.
 * @principle If a user adds different events to their schedule, they can then compare schedules and see which events they have in common.
 */
export default class SchedulingConcept {
  public readonly schedules: Collection<ScheduleDoc>;
  public readonly events: Collection<EventDoc>;

  constructor(private readonly db: Db) {
    this.schedules = this.db.collection(PREFIX + "schedules");
    this.events = this.db.collection(PREFIX + "events");
  }

  // ==================================================================================================
  // ACTIONS
  // ==================================================================================================

  /**
   * createSchedule (user: User): (schedule: Schedule) | (error: string)
   *
   * **requires**: The given `user` does not already have a schedule.
   * **effects**: Creates a new, empty `Schedule` `s`; associates `s` with the `user`; returns the new `Schedule`'s identifier as `schedule`.
   */
  async createSchedule({ user }: { user: User }): Promise<{ schedule: Schedule } | { error: string }> {
    const existingSchedule = await this.schedules.findOne({ user });
    if (existingSchedule) {
      return { error: "User already has a schedule." };
    }

    const scheduleId = freshID() as Schedule;
    const result = await this.schedules.insertOne({
      _id: scheduleId,
      user,
      events: [],
    });

    if (!result.acknowledged) {
      return { error: "Failed to create schedule in database." };
    }
    return { schedule: scheduleId };
  }

  /**
   * addEvent (event: Event, name: String, type: String, time: MeetingTime, user?: User): Empty | (error: string)
   *
   * **requires**: the `event` isn't already in the set of Events.
   * **effects**: Adds the `event` to the set of Events with the given info.
   */
  async addEvent({ event, name, type, time, user }: { event: Event; name: string; type: string; time: MeetingTime; user?: User }): Promise<Empty | { error: string }> {
    const existingEvent = await this.events.findOne({ _id: event });
    if (existingEvent) {
      return { error: "Event with this ID already exists." };
    }

    const newEvent: EventDoc = { _id: event, name, type, time };
    if (user) {
      newEvent.user = user;
    }

    const result = await this.events.insertOne(newEvent);
    if (!result.acknowledged) {
      return { error: "Failed to add event to database." };
    }
    return {};
  }

  /**
   * removeEvent (event: Event, user?: User): Empty | (error: string)
   *
   * **requires**: The `event` is in the set of events; If a user is given, then the event must have this user.
   * **effects**: Removes the `event` from the set of Events and cascades the deletion to all schedules containing it.
   */
  async removeEvent({ event, user }: { event: Event; user?: User }): Promise<Empty | { error: string }> {
    const eventDoc = await this.events.findOne({ _id: event });
    if (!eventDoc) {
      return { error: "Event not found." };
    }

    if (user && eventDoc.user !== user) {
      return { error: "User is not authorized to remove this event." };
    }

    const deleteResult = await this.events.deleteOne({ _id: event });
    if (deleteResult.deletedCount === 0) {
      return { error: "Failed to remove event from database." };
    }

    // Cascade delete: remove the event from any schedule that references it
    await this.schedules.updateMany({ events: event }, { $pull: { events: event } });

    return {};
  }

  /**
   * scheduleEvent (user: User, event: Event): Empty | (error: string)
   *
   * **requires**: The `user` has a schedule; the `event` is in the set of Events.
   * **effects**: Adds the `event` to the `user`'s schedule.
   */
  async scheduleEvent({ user, event }: { user: User; event: Event }): Promise<Empty | { error: string }> {
    const schedule = await this.schedules.findOne({ user });
    if (!schedule) {
      return { error: "User does not have a schedule." };
    }

    const eventDoc = await this.events.findOne({ _id: event });
    if (!eventDoc) {
      return { error: "Event not found." };
    }

    // Use $addToSet to prevent duplicates and make the operation idempotent.
    await this.schedules.updateOne({ _id: schedule._id }, { $addToSet: { events: event } });

    return {};
  }

  /**
   * unscheduleEvent (user: User, event: Event): Empty | (error: string)
   *
   * **requires**: The `user` has a schedule, and the `event` is in the `user`'s schedule.
   * **effects**: Removes the `event` from the `user`'s schedule.
   */
  async unscheduleEvent({ user, event }: { user: User; event: Event }): Promise<Empty | { error: string }> {
    const schedule = await this.schedules.findOne({ user });
    if (!schedule) {
      return { error: "User does not have a schedule." };
    }

    if (!schedule.events.includes(event)) {
      return { error: "Event is not in the user's schedule." };
    }

    await this.schedules.updateOne({ _id: schedule._id }, { $pull: { events: event } });

    return {};
  }

  // ==================================================================================================
  // QUERIES
  // ==================================================================================================

  /**
   * _getUserSchedule(user: User): (event: Event, name: String, type: String, times: MeetingTime)[]
   *
   * **requires**: The `user` has a schedule.
   * **effects**: Returns a set of all events in the user's schedule with their names, types, and times.
   */
  async _getUserSchedule({ user }: { user: User }): Promise<{ event: Event; name: string; type: string; times: MeetingTime }[]> {
    const schedule = await this.schedules.findOne({ user });
    if (!schedule || schedule.events.length === 0) {
      return [];
    }

    const eventDocs = await this.events.find({ _id: { $in: schedule.events } }).toArray();

    return eventDocs.map((doc) => ({
      event: doc._id,
      name: doc.name,
      type: doc.type,
      times: doc.time,
    }));
  }

  /**
   * _getScheduleComparison (user1: User, user2: User): (events: Event[])[]
   *
   * **requires**: Both `user1` and `user2` have schedules.
   * **effects**: Returns the common event IDs between the schedules of user1 and user2.
   */
  async _getScheduleComparison({ user1, user2 }: { user1: User; user2: User }): Promise<{ events: Event[] }[]> {
    const [schedule1, schedule2] = await Promise.all([this.schedules.findOne({ user: user1 }), this.schedules.findOne({ user: user2 })]);

    if (!schedule1 || !schedule2) {
      // If one or both users lack a schedule, their intersection of events is empty.
      return [{ events: [] }];
    }

    const events1 = new Set(schedule1.events);
    const commonEvents = schedule2.events.filter((event) => events1.has(event));

    return [{ events: commonEvents }];
  }
}
```