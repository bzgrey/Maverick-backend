---
timestamp: 'Fri Nov 14 2025 13:16:52 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251114_131652.f13984ad.md]]'
content_id: 72d8723c1d7b36af48eeafee7c83fd62359371fb2895f4d10dfbeaa7066de7db
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
* **queries**:
  * `_getAllCourses (): (course: Course)`
    * **effects**: Returns all `Course` objects in the catalog.
  * `_getCourse (course: Course): (course: Course)`
    * **requires**: The specified `course` must exist.
    * **effects**: Returns the full `Course` object matching the provided identifier.
  * `_getRegistrationsForStudent (student: Student): (registration: Registration, course: Course)`
    * **effects**: Returns all `Registration` records for the given `student`, along with the corresponding `Course` details for each registration.
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
