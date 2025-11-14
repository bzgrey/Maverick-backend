---
timestamp: 'Fri Nov 14 2025 13:37:09 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251114_133709.f401be07.md]]'
content_id: fe01869b6dafbca15818cb81500ffc29ff436abb4c52b673b3a1a384ab3e2e9c
---

# concept: CourseRegistering

* **concept**: CourseRegistering \[Student, Course]
* **purpose**: To allow a student to browse a catalog of available courses and build a personal, conflict-free schedule of desired courses for a term.
* **principle**: If a catalog of courses with defined meeting times for lectures and recitations is available, a student can add desired courses to their personal schedule and remove them, and the system will prevent them from adding courses with conflicting meeting times.
* **types**:
  * `MeetingTime`:
    * a set of `days` (e.g., {Tuesday, Thursday})
    * a `startTime` of type `Time`
    * an `endTime` of type `Time`
* **state**:
  * A set of `Courses` with
    * a `name` of type `String`
    * a `lecture` of type `MeetingTime`
    * an optional `recitation` of type `MeetingTime`
  * A set of `Registrations` with
    * a `student` of type `Student`
    * a `course` of type `Course`
* **queries**:
  * `_getAllCourses (): (course: Course)`
    * **effects**: Returns all `Course` objects in the catalog.
  * `_getCourse (course: Course): (course: Course)`
    * **requires**: The specified `course` must exist.
    * **effects**: Returns the full `Course` object matching the provided identifier.
  * `_getRegistrationsForStudent (student: Student): (registration: Registration, course: Course)`
    * **effects**: Returns all `Registration` records for the given `student`, along with the corresponding `Course` details for each registration.
* **actions**:
  * `defineCourse (name: String, lecture: MeetingTime, recitation?: MeetingTime): (course: Course)`
    * **requires**: For each meeting time provided, `startTime < endTime`.
    * **effects**: Creates a new course in the catalog with defined lecture and optional recitation times. This is typically an administrative action.
  * `addCourse (student: Student, course: Course)`
    * **requires**: The course must exist. The student must not already be registered for this course. The lecture and recitation times of the specified `course` must not have a time conflict with the lecture or recitation times of any other course for which the `student` has an existing `Registration`.
    * **effects**: Creates a new `Registration` linking the `student` and the `course`.
  * `removeCourse (student: Student, course: Course)`
    * **requires**: A `Registration` linking the specified `student` and `course` must exist.
    * **effects**: Removes the existing `Registration` for the `student` and `course`.
