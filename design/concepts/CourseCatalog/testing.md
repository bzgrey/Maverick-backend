[@testing-concepts](../../background/testing-concepts.md)

[@implementation](implementation.md)

# test: CourseCatalog
# response:

# file: src/concepts/CourseCatalog/CourseCatalogConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import CourseCatalogConcept from "./CourseCatalogConcept.ts";

Deno.test("CourseCatalogConcept", async (t) => {
  const [db, client] = await testDb();
  const catalog = new CourseCatalogConcept(db);

  await t.step("Action: defineCourse", async (t) => {
    await t.step(
      "should successfully define a new course with valid data",
      async () => {
        console.log(
          "Testing: Successful creation of a course 'Intro to Concepts'.",
        );
        const courseName = "Intro to Concepts";
        const events = [
          {
            type: "Lecture",
            times: { days: ["Monday", "Wednesday"], startTime: "10:00", endTime: "11:30" },
          },
          {
            type: "Recitation",
            times: { days: ["Friday"], startTime: "14:00", endTime: "15:00" },
          },
        ];

        console.log("Action: defineCourse with name and events");
        const result = await catalog.defineCourse({ name: courseName, events });
        console.log("Result:", result);

        // Check for success (no error key)
        assertEquals("error" in result, false, "Action should not return an error.");
        const { course: courseId } = result as { course: ID };
        assertExists(courseId);

        console.log(
          "Confirming effects: Retrieving the course info to verify its creation.",
        );
        const courseInfo = await catalog._getCourseInfo({ courses: [courseId] });
        console.log("Retrieved info:", courseInfo);

        assertEquals(courseInfo.length, 1);
        assertEquals(courseInfo[0].name, courseName);
        assertEquals(courseInfo[0].events.length, 2);
        // Clean up events from IDs for easier comparison
        const retrievedEvents = courseInfo[0].events.map((e) => ({ type: e.type, times: e.times }));
        assertEquals(retrievedEvents, events);
      },
    );

    await t.step(
      "should fail if a course with the same name already exists",
      async () => {
        console.log(
          "Testing requires: Attempting to create a course with a duplicate name.",
        );
        const courseName = "Duplicate Course";
        const events = [{
          type: "Lecture",
          times: { days: ["Tuesday"], startTime: "09:00", endTime: "10:00" },
        }];

        console.log("Action: defineCourse (first attempt, should succeed)");
        const firstResult = await catalog.defineCourse({ name: courseName, events });
        console.log("Result:", firstResult);
        assertEquals("error" in firstResult, false);

        console.log("Action: defineCourse (second attempt, should fail)");
        const secondResult = await catalog.defineCourse({ name: courseName, events });
        console.log("Result:", secondResult);
        assertExists(secondResult.error);
        assertEquals(
          secondResult.error,
          `Course with name '${courseName}' already exists.`,
        );
      },
    );

    await t.step(
      "should fail if any event has an invalid meeting time",
      async () => {
        console.log(
          "Testing requires: Attempting to create a course with endTime before startTime.",
        );
        const courseName = "Invalid Time Course";
        const events = [{
          type: "Lab",
          times: { days: ["Thursday"], startTime: "16:00", endTime: "15:00" }, // Invalid
        }];

        console.log("Action: defineCourse with invalid time");
        const result = await catalog.defineCourse({ name: courseName, events });
        console.log("Result:", result);

        assertExists(result.error);
        assertEquals(
          result.error,
          "Invalid meeting time: startTime 16:00 must be before endTime 15:00.",
        );
      },
    );
  });

  await t.step("Principle: Define and retrieve courses", async () => {
    console.log(
      "\nTesting Principle: One can define courses with their given information and then access the information to each course.",
    );
    console.log("This trace will define two courses and then retrieve all of them to verify the catalog works as expected.");

    // Step 1: Define two courses
    console.log("\nTrace Step 1: Defining 'History of Art' and 'Compiler Design'.");
    const artCourseResult = await catalog.defineCourse({
      name: "History of Art",
      events: [{ type: "Lecture", times: { days: ["Tuesday", "Thursday"], startTime: "13:00", endTime: "14:30" } }],
    });
    const compilerCourseResult = await catalog.defineCourse({
      name: "Compiler Design",
      events: [
        { type: "Lecture", times: { days: ["Monday", "Friday"], startTime: "11:00", endTime: "12:30" } },
        { type: "Lab", times: { days: ["Wednesday"], startTime: "15:00", endTime: "17:00" } },
      ],
    });

    const artCourseId = (artCourseResult as { course: ID }).course;
    const compilerCourseId = (compilerCourseResult as { course: ID }).course;

    assertNotEquals(artCourseId, undefined);
    assertNotEquals(compilerCourseId, undefined);
    console.log("Defined 'History of Art' with ID:", artCourseId);
    console.log("Defined 'Compiler Design' with ID:", compilerCourseId);

    // Step 2: Access the information for all courses
    console.log("\nTrace Step 2: Accessing information for all courses via _getAllCourses.");
    const allCourses = await catalog._getAllCourses();
    console.log(`Query: _getAllCourses(), found ${allCourses.length} courses.`);

    // There might be courses from previous steps, so we check that our two new courses exist.
    const artCourseInfo = allCourses.find((c) => c.name === "History of Art");
    const compilerCourseInfo = allCourses.find((c) => c.name === "Compiler Design");

    assertExists(artCourseInfo, "History of Art course should be in the catalog.");
    assertExists(compilerCourseInfo, "Compiler Design course should be in the catalog.");
    assertEquals(artCourseInfo.events.length, 1);
    assertEquals(compilerCourseInfo.events.length, 2);
    console.log("Successfully verified that both courses were created and can be retrieved.");

    // Step 3: Access information for specific events of a course
    console.log("\nTrace Step 3: Accessing meeting times for specific events.");
    const compilerEventIds = compilerCourseInfo.events.map((e) => e.event);
    const eventTimes = await catalog._getEventTimes({ events: compilerEventIds });
    console.log(`Query: _getEventTimes() for ${compilerEventIds.length} events.`);
    console.log("Result:", eventTimes);
    
    assertEquals(eventTimes.length, 2);
    assertEquals(eventTimes.map(e => e.times.startTime).sort(), ["11:00", "15:00"]);
    console.log("Successfully verified event times can be retrieved.");

    console.log(
      "\nPrinciple Confirmed: The ability to define multiple courses and later access their full information demonstrates that the concept fulfills its purpose.",
    );
  });

  await client.close();
});
```

# trace:

The principle for the `CourseCatalog` is: "One can define courses with their given information and then access the information to each course". A trace that demonstrates this principle would involve the following sequence of actions:

1.  **`defineCourse("Intro to AI", ...)`**: An administrator defines the first course, "Intro to AI", specifying its lecture and lab times. The system creates the course and its associated events, returning a unique `Course` ID.
2.  **`defineCourse("Databases", ...)`**: The administrator defines a second course, "Databases", with its own schedule. The system creates this course and returns another unique `Course` ID.
3.  **`_getAllCourses()`**: A student or advisor wants to see all available courses. They query the system, which returns a list containing both "Intro to AI" and "Databases", complete with their names and full event schedules (`type`, `days`, `startTime`, `endTime`).
4.  **`_getCourseInfo(["course_id_for_databases"])`**: The student is particularly interested in the "Databases" course. They query for specific information about that course using its ID. The system returns only the detailed information for "Databases".

This sequence directly models the principle by first populating the catalog (`defineCourse`) and then successfully retrieving that information (`_getAllCourses`, `_getCourseInfo`), showing that the concept correctly tracks and provides access to course data.
