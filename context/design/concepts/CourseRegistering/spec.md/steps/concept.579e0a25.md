---
timestamp: 'Fri Nov 14 2025 13:16:20 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251114_131620.6491096a.md]]'
content_id: 579e0a25d2885dffcbdc5d9cc88cdb03a704287cc60f7bc1d4e3d9eefd6d052d
---

# concept: CourseRegistering

* **concept**: CourseRegistering \[Student, Course]
* **purpose**: To allow a student to browse a catalog of available courses and build a personal, conflict-free schedule of desired courses for a term.
* **principle**: If a catalog of courses with defined meeting times is available, a student can add desired courses to their personal schedule and remove them, and the system will prevent them from adding courses with conflicting times.
* **state**:
  * A set of `Courses` with
    * a `name` of type `String`
    * a set of `days` (e.g., {Monday, Wednesday})
    * a `startTime` of type `Time`
    * an `endTime` of type `Time`
  * A set of `Registrations` with
    * a `student` of type `Student`
    * a `course` of type `Course`
* **actions**:
  * `defineCourse (name: String, days: Set<Day>, startTime: Time, endTime: Time): (course: Course)`
    * **requires**: `startTime < endTime`.
    * **effects**: Creates a new course in the catalog available for registration. This is typically an administrative action.
  * `addCourse (student: Student, course: Course)`
    * **requires**: The course must exist. The student must not already be registered for this course. The specified `course` must not have a time conflict with any other course for which the `student` has an existing `Registration`.
    * **effects**: Creates a new `Registration` linking the `student` and the `course`.
  * `removeCourse (student: Student, course: Course)`
    * **requires**: A `Registration` linking the specified `student` and `course` must exist.
    * **effects**: Removes the existing `Registration` for the `student` and `course`.
