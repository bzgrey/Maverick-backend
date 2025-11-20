[@implementing-concepts](../../background/implementing-concepts.md)

[@CourseCatalog](CourseCatalog.md)


# implement: CourseCatalog
# response:

# concept: CourseCatalog

**concept:** CourseCatalog\[Event]
**purpose**: Track the courses offered in a school with all of the information for each course regarding times, class types, name
**principle**: One can define courses with their given information and then access the information to each course

**types**:

*   `MeetingTime`:
    *   a set of `days` (e.g., {Tuesday, Thursday})
    *   a `startTime` of type `Time`
    *   an `endTime` of type `Time`

**state**:

*   a set of Courses with
    *   a name String
    *   a set of Events
*   a set of Events with
    *   a type String (one of Lecture/Recitation/Lab)
    *   a MeetingTime

**actions**:

*   `defineCourse (name: String, events: (Event, type: String, times: MeetingTime)[]): (course: Course)`
    *   **requires**: For each meeting time provided, `startTime < endTime`.  Course with given name doesn't exist
    *   **effects**: Creates a new course in the set of Courses with defined lecture and optional recitation and lab times. This is typically an administrative action.

**queries:**

*   `_getAllCourses (): (courses: (course, name: String, events: (Event, type: String, times: MeetingTime))[])`
    *   **effects**: Returns all `Courses` in the catalog with their information.
*   \_getCourseInfo (courses: Course\[]): ((name: String, events: (Event, type: String, times: MeetingTime))\[])
    *   **requires:** courses exist
    *   **effects:** returns the course info for each course
*   \_getEventTimes (events: Event\[]): ((event, times: MeetingTime)\[])
    *   **requires:** each event exists
    *   **effects:** returns the MeetingTimes for each given event

# file: src/concepts/coursecatalog/CourseCatalogConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Define Prefix for collections to avoid name clashes.
const PREFIX = "CourseCatalog.";

// Generic types for this concept.
type Course = ID;
type Event = ID; // Generic parameter from the concept specification: CourseCatalog[Event]

// Custom Types from the concept specification.

/**
 * A type for time, represented as a string in "HH:MM" format.
 */
type Time = string;

/**
 * Represents the meeting time for a course event.
 * Includes days of the week, and start/end times.
 */
interface MeetingTime {
  days: string[]; // e.g., ["Tuesday", "Thursday"]
  startTime: Time;
  endTime: Time;
}

// Interfaces for MongoDB collection documents, representing the concept's state.

/**
 * State: a set of Courses with
 * - a name String
 * - a set of Events
 */
interface CourseDoc {
  _id: Course;
  name: string;
  events: Event[];
}

/**
 * State: a set of Events with
 * - a type String (one of Lecture/Recitation/Lab)
 * - a MeetingTime
 */
interface EventDoc {
  _id: Event;
  type: string;
  times: MeetingTime;
}

/**
 * @concept CourseCatalog[Event]
 * @purpose Track the courses offered in a school with all of the information for each course regarding times, class types, name.
 * @principle One can define courses with their given information and then access the information to each course.
 */
export default class CourseCatalogConcept {
  public readonly courses: Collection<CourseDoc>;
  public readonly events: Collection<EventDoc>;

  constructor(private readonly db: Db) {
    this.courses = this.db.collection<CourseDoc>(PREFIX + "courses");
    this.events = this.db.collection<EventDoc>(PREFIX + "events");
  }

  /**
   * defineCourse (name: String, events: (type: String, times: MeetingTime)[]): (course: Course)
   *
   * @requires For each meeting time provided, startTime < endTime.
   * @requires Course with given name doesn't exist.
   * @effects Creates a new course in the set of Courses with defined events (e.g., lecture, recitation, lab).
   */
  async defineCourse(
    { name, events }: { name: string; events: { type: string; times: MeetingTime }[] },
  ): Promise<{ course: Course } | { error: string }> {
    // Requirement: Course with given name doesn't exist
    const existingCourse = await this.courses.findOne({ name });
    if (existingCourse) {
      return { error: `Course with name '${name}' already exists.` };
    }

    // Requirement: For each meeting time, startTime < endTime
    for (const event of events) {
      if (event.times.startTime >= event.times.endTime) {
        return { error: `Invalid meeting time: startTime ${event.times.startTime} must be before endTime ${event.times.endTime}.` };
      }
    }

    // Effect: Create new Event documents
    const newEventDocs: EventDoc[] = events.map((e) => ({
      _id: freshID() as Event,
      type: e.type,
      times: e.times,
    }));

    if (newEventDocs.length > 0) {
      await this.events.insertMany(newEventDocs);
    }

    // Effect: Create new Course document
    const newCourseDoc: CourseDoc = {
      _id: freshID() as Course,
      name,
      events: newEventDocs.map((e) => e._id),
    };

    await this.courses.insertOne(newCourseDoc);

    return { course: newCourseDoc._id };
  }

  /**
   * _getAllCourses (): (courses: (course, name: String, events: (Event, type: String, times: MeetingTime))[])
   *
   * @effects Returns all `Courses` in the catalog with their information.
   */
  async _getAllCourses(): Promise<[{ courses: { course: Course; name: string; events: { event: Event; type: string; times: MeetingTime }[] }[] }]> {
    const coursesWithEvents = await this.courses.aggregate([
      {
        $lookup: {
          from: this.events.collectionName,
          localField: "events",
          foreignField: "_id",
          as: "eventDetails",
        },
      },
      {
        $project: {
          _id: 0,
          course: "$_id",
          name: "$name",
          events: {
            $map: {
              input: "$eventDetails",
              as: "e",
              in: {
                event: "$$e._id",
                type: "$$e.type",
                times: "$$e.times",
              },
            },
          },
        },
      },
    ]).toArray();

    const result = coursesWithEvents as { course: Course; name: string; events: { event: Event; type: string; times: MeetingTime }[] }[];
    return [{ courses: result }];
  }

  /**
   * _getCourseInfo (courses: Course[]): ((name: String, events: (Event, type: String, times: MeetingTime))[])
   *
   * @requires courses exist
   * @effects returns the course info for each course
   */
  async _getCourseInfo({ courses }: { courses: Course[] }): Promise<{ name: string; events: { event: Event; type: string; times: MeetingTime }[] }[]> {
    const courseInfos = await this.courses.aggregate([
      {
        $match: { _id: { $in: courses } },
      },
      {
        $lookup: {
          from: this.events.collectionName,
          localField: "events",
          foreignField: "_id",
          as: "eventDetails",
        },
      },
      {
        $project: {
          _id: 0,
          name: "$name",
          events: {
            $map: {
              input: "$eventDetails",
              as: "e",
              in: {
                event: "$$e._id",
                type: "$$e.type",
                times: "$$e.times",
              },
            },
          },
        },
      },
    ]).toArray();

    return courseInfos as { name: string; events: { event: Event; type: string; times: MeetingTime }[] }[];
  }

  /**
   * _getEventTimes (events: Event[]): ((event, times: MeetingTime)[])
   *
   * @requires each event exists
   * @effects returns the MeetingTimes for each given event
   */
  async _getEventTimes({ events }: { events: Event[] }): Promise<{ event: Event; times: MeetingTime }[]> {
    const eventDocs = await this.events.find(
      { _id: { $in: events } },
      { projection: { _id: 1, times: 1 } },
    ).toArray();

    return eventDocs.map((doc) => ({
      event: doc._id,
      times: doc.times,
    }));
  }
}
```