---
timestamp: 'Thu Nov 20 2025 00:02:33 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251120_000233.e6670b9c.md]]'
content_id: 829f075988b03398cce866a3c4b7173e3db1d6bfdda6bd4e47c211a7dfd8fd91
---

# file: src/concepts/coursecatalog/CourseCatalogConcept.test.ts

````typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import CourseCatalogConcept from "./CourseCatalogConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("CourseCatalog Concept", async (t) => {
  const [db, client] = await testDb();
  const catalog = new CourseCatalogConcept(db);

  await t.step("Action: defineCourse", async (t) => {
    await t.step("should successfully define a new course with valid data", async () => {
      console.log("Testing: defineCourse with a valid new course 'Intro to CS'");
      const courseName = "Intro to CS";
      const events = [
        { type: "Lecture", times: { days: ["Monday", "Wednesday"], startTime: "10:00", endTime: "11:00" } },
        { type: "Recitation", times: { days: ["Friday"], startTime: "13:00", endTime: "14:00" } },
      ];

      console.log(`Action: defineCourse({ name: "${courseName}", ... })`);
      const result = await catalog.defineCourse({ name: courseName, events });
      console.log("Result:", result);

      assertNotEquals((result as { error: string }).error, undefined, "Expected no error on successful course definition");
      const { course: courseId } = result as { course: ID };
      assertExists(courseId);

      console.log("Confirming effects: Verifying course and event creation using _getCourseInfo");
      const courseInfo = await catalog._getCourseInfo({ courses: [courseId] });
      console.log("Query Result (_getCourseInfo):", courseInfo);

      assertEquals(courseInfo.length, 1);
      assertEquals(courseInfo[0].name, courseName);
      assertEquals(courseInfo[0].events.length, 2);
      // We can't guarantee order, so check for existence of both types
      assertExists(courseInfo[0].events.find(e => e.type === "Lecture"));
      assertExists(courseInfo[0].events.find(e => e.type === "Recitation"));
    });

    await t.step("should fail if course name already exists", async () => {
      console.log("Testing requires: fail to define a course with a duplicate name 'Data Structures'");
      const courseName = "Data Structures";
      const events = [
        { type: "Lecture", times: { days: ["Tuesday", "Thursday"], startTime: "14:30", endTime: "16:00" } },
      ];

      console.log("Action 1: defineCourse({ name: 'Data Structures', ... }) - should succeed");
      const firstResult = await catalog.defineCourse({ name: courseName, events });
      console.log("Result 1:", firstResult);
      assertNotEquals((firstResult as { error: string }).error, undefined, "First course definition should succeed");

      console.log("Action 2: defineCourse({ name: 'Data Structures', ... }) - should fail");
      const secondResult = await catalog.defineCourse({ name: courseName, events });
      console.log("Result 2:", secondResult);
      assertExists((secondResult as { error: string }).error, "Expected an error for duplicate course name");
      assertEquals((secondResult as { error: string }).error, `Course with name '${courseName}' already exists.`);
    });

    await t.step("should fail if any event has an invalid time range", async () => {
      console.log("Testing requires: fail to define a course with startTime >= endTime");
      const courseName = "Algorithms";
      const events = [
        { type: "Lecture", times: { days: ["Monday"], startTime: "11:00", endTime: "10:00" } }, // Invalid
      ];

      console.log(`Action: defineCourse({ name: "${courseName}", events: [...] }) with invalid times`);
      const result = await catalog.defineCourse({ name: courseName, events });
      console.log("Result:", result);

      assertExists((result as { error: string }).error, "Expected an error for invalid meeting time");
      assertEquals((result as { error: string }).error, "Invalid meeting time: startTime 11:00 must be before endTime 10:00.");

      console.log("Confirming effects: Verifying no course was created using _getAllCourses");
      const allCourses = await catalog._getAllCourses();
      const courseExists = allCourses[0].courses.some(c => c.name === courseName);
      assertEquals(courseExists, false, "Course should not have been created");
    });
  });

  await t.step("Queries", async (t) => {
    // Setup: Define some courses for query tests
    await catalog.defineCourse({ name: "Query Course A", events: [{ type: "Lab", times: { days: ["Wednesday"], startTime: "09:00", endTime: "12:00" } }] });
    await catalog.defineCourse({ name: "Query Course B", events: [{ type: "Lecture", times: { days: ["Friday"], startTime: "15:00", endTime: "16:30" } }] });
    
    await t.step("_getAllCourses: should return all defined courses", async () => {
        console.log("Testing query: _getAllCourses");
        const result = await catalog._getAllCourses();
        const courses = result[0].courses;
        console.log("Result:", courses);
        
        // This test file defines 4 courses in total before this point
        assertEquals(courses.length, 4, "Should return all previously defined courses");
        assertExists(courses.find(c => c.name === "Intro to CS"));
        assertExists(courses.find(c => c.name === "Data Structures"));
        assertExists(courses.find(c => c.name === "Query Course A"));
        assertExists(courses.find(c => c.name === "Query Course B"));
    });
    
    await t.step("_getCourseInfo: should return information for specified courses", async () => {
        console.log("Testing query: _getCourseInfo");
        const allCoursesResult = await catalog._getAllCourses();
        const courseA = allCoursesResult[0].courses.find(c => c.name === "Query Course A");
        assertExists(courseA);

        console.log(`Query: _getCourseInfo({ courses: ["${courseA.course}"] })`);
        const info = await catalog._getCourseInfo({ courses: [courseA.course] });
        console.log("Result:", info);

        assertEquals(info.length, 1);
        assertEquals(info[0].name, "Query Course A");
        assertEquals(info[0].events.length, 1);
        assertEquals(info[0].events[0].type, "Lab");
    });
    
    await t.step("_getEventTimes: should return meeting times for specified events", async () => {
        console.log("Testing query: _getEventTimes");
        const allCoursesResult = await catalog._getAllCourses();
        const courseB = allCoursesResult[0].courses.find(c => c.name === "Query Course B");
        assertExists(courseB);
        const eventId = courseB.events[0].event;

        console.log(`Query: _getEventTimes({ events: ["${eventId}"] })`);
        const times = await catalog.getEventTimes({ events: [eventId] });
        console.log("Result:", times);

        assertEquals(times.length, 1);
        assertEquals(times[0].event, eventId);
        assertEquals(times[0].times, { days: ["Friday"], startTime: "15:00", endTime: "16:30" });
    });
  });

  await client.close();
});

# trace:

The principle of the `CourseCatalog` concept is that "One can define courses with their given information and then access the information to each course". This trace will demonstrate the fulfillment of this principle through a series of actions and queries.

```typescript
Deno.test("Principle: Define and access course information", async () => {
  const [db, client] = await testDb();
  const catalog = new CourseCatalogConcept(db);

  console.log("--- TRACE START: Fulfilling the CourseCatalog Principle ---");

  // Step 1: Define a new course, "Database Systems".
  console.log("\nStep 1: An administrator defines the 'Database Systems' course.");
  const dbSystemsEvents = [
    { type: "Lecture", times: { days: ["Tuesday", "Thursday"], startTime: "10:00", endTime: "11:30" } },
    { type: "Recitation", times: { days: ["Wednesday"], startTime: "16:00", endTime: "17:00" } },
  ];
  const defineResult = await catalog.defineCourse({ name: "Database Systems", events: dbSystemsEvents });
  console.log("Action: defineCourse('Database Systems', ...)\nResult:", defineResult);
  const { course: dbSystemsId } = defineResult as { course: ID };
  assertExists(dbSystemsId, "Course definition must be successful.");

  // Step 2: Define another course, "Operating Systems".
  console.log("\nStep 2: An administrator defines the 'Operating Systems' course.");
  const osEvents = [
    { type: "Lecture", times: { days: ["Monday", "Friday"], startTime: "13:00", endTime: "14:30" } },
  ];
  const osDefineResult = await catalog.defineCourse({ name: "Operating Systems", events: osEvents });
  console.log("Action: defineCourse('Operating Systems', ...)\nResult:", osDefineResult);
  assertExists((osDefineResult as { course: ID }).course, "Second course definition must be successful.");

  // Step 3: Access the information for all courses in the catalog.
  console.log("\nStep 3: A student or advisor queries for all available courses.");
  const allCoursesResult = await catalog._getAllCourses();
  const allCourses = allCoursesResult[0].courses;
  console.log("Query: _getAllCourses()\nResult:", allCourses);
  assertEquals(allCourses.length, 2, "The catalog should contain two courses.");
  assertExists(allCourses.find(c => c.name === "Database Systems"));
  assertExists(allCourses.find(c => c.name === "Operating Systems"));
  console.log("Verification: Confirmed that both defined courses are listed in the catalog.");
  
  // Step 4: Access specific information for the "Database Systems" course.
  console.log("\nStep 4: A student wants to see the details of 'Database Systems'.");
  const courseInfoResult = await catalog._getCourseInfo({ courses: [dbSystemsId] });
  console.log(`Query: _getCourseInfo({ courses: ["${dbSystemsId}"] })\nResult:`, courseInfoResult);
  assertEquals(courseInfoResult.length, 1);
  assertEquals(courseInfoResult[0].name, "Database Systems");
  assertEquals(courseInfoResult[0].events.length, 2);
  console.log("Verification: Retrieved detailed information matches the initial definition.");

  // Step 5: Access the specific times for the events of the "Database Systems" course.
  const eventIds = courseInfoResult[0].events.map(e => e.event);
  console.log(`\nStep 5: A scheduling system needs the meeting times for the events of 'Database Systems'.`);
  const eventTimesResult = await catalog._getEventTimes({ events: eventIds });
  console.log(`Query: _getEventTimes({ events: [...] })\nResult:`, eventTimesResult);
  assertEquals(eventTimesResult.length, 2, "Should retrieve times for both lecture and recitation.");
  console.log("Verification: Retrieved event times are correct.");

  console.log("\n--- TRACE END: Principle Fulfilled ---");
  console.log("The trace demonstrates that courses can be defined and their information can be accessed in various ways, satisfying the principle.");

  await client.close();
});
````
