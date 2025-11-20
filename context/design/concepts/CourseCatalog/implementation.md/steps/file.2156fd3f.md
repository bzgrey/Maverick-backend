---
timestamp: 'Wed Nov 19 2025 16:46:22 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251119_164622.d29f642b.md]]'
content_id: 2156fd3f779cfcba00f20ba87037c83f8fae133753c5af2beaea8673e59119ec
---

# file: src/concepts/CourseCatalog/CourseCatalogConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Define a prefix for collection names to avoid collisions and keep the database organized.
const PREFIX = "CourseCatalog.";

// Define type aliases for the IDs used in this concept for clarity.
type Course = ID;
type Event = ID;

/**
 * Represents the meeting time for a course event.
 * It includes a set of days (e.g., ["Tuesday", "Thursday"]), a start time, and an end time.
 * Times are stored as strings in "HH:MM" format.
 */
export interface MeetingTime {
  days: string[];
  startTime: string;
  endTime: string;
}

/**
 * Database document structure for a Course.
 * a set of Courses with
 *   a name String
 *   a set of Events
 */
interface CourseDoc {
  _id: Course;
  name: string;
  events: Event[]; // An array of Event IDs associated with this course.
}

/**
 * Database document structure for an Event.
 * a set of Events with
 *   a type String (one of Lecture/Recitation/Lab)
 *   a MeetingTime
 */
interface EventDoc {
  _id: Event;
  type: string;
  times: MeetingTime;
}

/**
 * Input type for creating events within the defineCourse action.
 * This is used because events are created as part of the course definition.
 */
interface EventInput {
  type: string;
  times: MeetingTime;
}

/**
 * @concept CourseCatalog[Event]
 * @purpose Track the courses offered in a school with all of the information for each course regarding times, class types, name.
 * @principle One can define courses with their given information and then access the information to each course.
 */
export default class CourseCatalogConcept {
  private readonly courses: Collection<CourseDoc>;
  private readonly events: Collection<EventDoc>;

  constructor(private readonly db: Db) {
    this.courses = this.db.collection<CourseDoc>(PREFIX + "courses");
    this.events = this.db.collection<EventDoc>(PREFIX + "events");
  }

  /**
   * defineCourse (name: String, events: (Event, type: String, times: MeetingTime)[]): (course: Course)
   *
   * **requires**: For each meeting time provided, `startTime < endTime`. Course with given name doesn't exist.
   * **effects**: Creates a new course in the set of Courses with defined lecture and optional recitation and lab times. This is typically an administrative action.
   */
  async defineCourse({ name, events }: { name: string; events: EventInput[] }): Promise<{ course: Course } | { error: string }> {
    // **requires**: For each meeting time provided, startTime < endTime.
    for (const event of events) {
      if (event.times.startTime >= event.times.endTime) {
        return { error: `Invalid meeting time: startTime ${event.times.startTime} must be before endTime ${event.times.endTime}.` };
      }
    }

    // **requires**: Course with given name doesn't exist.
    const existingCourse = await this.courses.findOne({ name });
    if (existingCourse) {
      return { error: `Course with name '${name}' already exists.` };
    }

    // **effects**: Create new Event documents for the course.
    const newEventDocs: EventDoc[] = events.map((event) => ({
      _id: freshID(),
      type: event.type,
      times: event.times,
    }));

    if (newEventDocs.length > 0) {
      await this.events.insertMany(newEventDocs);
    }

    const eventIds = newEventDocs.map((doc) => doc._id);

    // **effects**: Create a new Course document.
    const newCourseDoc: CourseDoc = {
      _id: freshID(),
      name,
      events: eventIds,
    };
    await this.courses.insertOne(newCourseDoc);

    return { course: newCourseDoc._id };
  }

  /**
   * _getAllCourses (): (courses: (course, name: String, events: (Event, type: String, times: MeetingTime))[])
   * **effects**: Returns all `Courses` in the catalog with their information.
   */
  async _getAllCourses(): Promise<{ courses: { course: Course; name: string; events: { event: Event; type: string; times: MeetingTime }[] }[] }[]> {
    const allCoursesWithEvents = await this.courses
      .aggregate([
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
                as: "event",
                in: {
                  event: "$$event._id",
                  type: "$$event.type",
                  times: "$$event.times",
                },
              },
            },
          },
        },
      ])
      .toArray();

    return [{ courses: allCoursesWithEvents }];
  }

  /**
   * _getCourseInfo (courses: Course[]): ((name: String, events: (Event, type: String, times: MeetingTime))[])
   *
   * **requires**: courses exist
   * **effects**: returns the course info for each course
   */
  async _getCourseInfo({ courses }: { courses: Course[] }): Promise<{ name: string; events: { event: Event; type: string; times: MeetingTime }[] }[]> {
    const courseInfos = await this.courses
      .aggregate([
        { $match: { _id: { $in: courses } } },
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
                as: "event",
                in: {
                  event: "$$event._id",
                  type: "$$event.type",
                  times: "$$event.times",
                },
              },
            },
          },
        },
      ])
      .toArray();

    return courseInfos;
  }

  /**
   * _getEventTimes (events: Event[]): ((event, times: MeetingTime)[])
   *
   * **requires**: each event exists
   * **effects**: returns the MeetingTimes for each given event
   */
  async _getEventTimes({ events }: { events: Event[] }): Promise<{ event: Event; times: MeetingTime }[]> {
    const eventTimes = await this.events
      .find({ _id: { $in: events } }, { projection: { _id: 1, times: 1 } })
      .map((doc) => ({
        event: doc._id,
        times: doc.times,
      }))
      .toArray();

    return eventTimes;
  }
}
```
