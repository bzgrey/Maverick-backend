---
timestamp: 'Tue Nov 18 2025 21:56:51 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251118_215651.181597cd.md]]'
content_id: 50b3625f25c775ea6849124c94410c9222999502bed93fd82ee1cff381949664
---

# concept: CourseCatalog

**concept:** CourseCatalog\[Event]
**purpose**: Track the courses offered in a school with all of the information for each course regarding times, class types, name
**principle**: One can define courses with their given information and then access the information to each course

**types**:

* `MeetingTime`:
  * a set of `days` (e.g., {Tuesday, Thursday})
  * a `startTime` of type `Time`
  * an `endTime` of type `Time`

**state**:

* a set of Courses with
  * a name String
  * a set of Events
* a set of Events with
  * a type String (one of Lecture/Recitation/Lab)
  * a MeetingTime

**actions**:

* `defineCourse (name: String, events: (Event, type: String, times: MeetingTime)[]): (course: Course)`
  * **requires**: For each meeting time provided, `startTime < endTime`.  Course with given name doesn't exist
  * **effects**: Creates a new course in the set of Courses with defined lecture and optional recitation and lab times. This is typically an administrative action.

**queries:**

* `_getAllCourses (): (courses: (course, name: String, events: (Event, type: String, times: MeetingTime))[])`
  * **effects**: Returns all `Courses` in the catalog with their information.
* \_getCourseInfo (courses: Course\[]): ((name: String, events: (Event, type: String, times: MeetingTime))\[])
  * **requires:** courses exist
  * **effects:** returns the course info for each course
* \_getEventTimes (events: Event\[]): ((event, times: MeetingTime)\[])
  * **requires:** each event exists
  * **effects:** returns the MeetingTimes for each given event

- **concept**: Blocking \[User]
- **purpose**: To empower users to prevent specific individuals from viewing their information, even if they are in a shared group or context.
- **principle**: If User A blocks User B, then even if they are both members of the same group, any application feature that tries to show User A's schedule to User B will fail or show nothing.
- **state**:
  * A set of blockLists with:
    * a `user`:User
    * a `blockedUsers` list of Users
- **actions**:
  * `blockUser (blocker: User, userToBlock: User)`
    * **requires** blocker is not userToBlock
    * **effects** If blocker exists as a user in `blockLists`, add `userToBlock` to `blockedUsers` for the entry of blockLists with user==blocker if userToBlock isn't already in the `blockedUsers` list. Otherwise create a new blockLists entry with user=blocker, and the list \[userToBlock]
  * `unblockUser (blocker: User, userToUnblock: User)`
    * **requires** `userToUnblock` is in the `blockedUsers` list for the entry in blockLists where `user` is `blocker`
    * **effects** Removes the pair `userToUnblock` from the `blockedUsers` list.
- **queries**:
  * `_isUserBlocked(primaryUser: User, secondaryUser: User): [Boolean]`
    * **effects** Returns true if `primaryUser` is a user in a blockLists entry and `secondaryUser` is in that entry’s `blockedUsers` list.
  * `blockedUsers(user:User):Users[]`
    * **effects** returns blockedUsers for blockLists entry with `user`, and if one doesn't exist return an empty list
