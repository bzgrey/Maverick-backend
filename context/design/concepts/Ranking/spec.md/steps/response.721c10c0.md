---
timestamp: 'Fri Nov 14 2025 13:20:12 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251114_132012.98e752ca.md]]'
content_id: 721c10c026e593bb365e20813f3b33460bd45647c976e69a4d53ea39f600d98d
---

# response:

Excellent question. This is a great example of how a change in requirements directly translates into a change in a concept's definition and, consequently, its interactions.

The constraint "only one ranking associated with a course at a time" fundamentally changes the `Ranking` concept. It's no longer about *users* ranking items, but about items having a single, canonical rank or score.

Here is the revised concept specification, followed by the updated synchronizations that use it.

***

### Revised Concept: Ranking

This version removes the `User` parameter and simplifies the state to enforce that any given `Item` can only have one score. This aligns perfectly with the original `Ranking` concept provided in the documentation.

* **concept**: Ranking \[Item]
* **purpose**: To maintain an ordered list of items, where each item has a single, canonical numerical score.
* **principle**: An item can be assigned a score. If a score is set or updated for an item, its position in any ordered retrieval is adjusted. An item can only have one score at a time.
* **state**:
  * A mapping from `Item` to its `score` of type `Number`.
  * **Note**: This state structure naturally enforces the one-to-one relationship. You cannot have two different scores for the same `Item`.
* **actions**:
  * `setScore (item: Item, score: Number)`
    * **requires**: `score` must be a valid number.
    * **effects**: Assigns or updates the score for the given item. If the item is not yet in the ranking, it is added.
    * **returns**: `(item: Item, score: Number)` — The item and its new score.
  * `removeItem (item: Item)`
    * **requires**: The item must exist in the ranking.
    * **effects**: Removes the item and its associated score from the ranking.
* **queries**:
  * `_findRankedItem (item: Item): (item: Item)`
    * **purpose**: To determine if a specific item exists within the ranking system (i.e., has a score). This is used for cleanup to find the item that needs to be removed.
    * **inputs**: `item` - The identifier of the item to look up.
    * **outputs**: `item` - The identifier of the item *if it was found*. Returns zero or one result.

***

### Revised Synchronizations

With the new, simpler `Ranking` concept, the synchronizations that interact with it also become simpler and more direct.

#### Revised User-Facing Syncs (`src/syncs/user_requests.sync.ts`)

The request to set a score no longer needs to look up the user, as the `Ranking` concept doesn't care who is setting the score.

```typescript
import { actions, Sync } from "@engine";
import { Ranking, Requesting } from "@concepts";

// Handles the request to set or update a course's rank/score.
// NOTE: We've removed Sessioning and the 'user' variable, as they are no longer
// required by the Ranking.setScore action. Authorization could be handled
// in a separate sync if needed (e.g., checking if a user is an admin).
export const SetCourseScoreRequest: Sync = ({ request, courseId, score }) => ({
  when: actions([
    Requesting.request,
    { path: "/courses/score", courseId, score },
    { request },
  ]),
  // No 'where' clause is needed to look up the user.
  then: actions([
    Ranking.setScore, { item: courseId, score }
  ]),
});

// A success response for the setScore action.
export const ScoreSuccessResponse: Sync = ({ request, item, score }) => ({
    when: actions(
      [Requesting.request, { path: "/courses/score" }, { request }],
      [Ranking.setScore, {}, { item, score }],
    ),
    then: actions([
      Requesting.respond, { request, status: "success", body: { item, score } }
    ]),
  });
```

#### Revised Inter-Concept Syncs (`src/syncs/cleanup.sync.ts`)

This synchronization is now simpler. Instead of finding *many* user-specific ranks to delete, it finds *at most one* ranked item and removes it.

```typescript
import { actions, Sync } from "@engine";
import { CourseRegistering, Ranking } from "@concepts";

/**
 * When a course is removed, this sync ensures its single, canonical
 * score is also removed from the Ranking concept.
 */
export const CleanupScoreOnCourseRemoval: Sync = ({ courseId }) => ({
  // The trigger remains the same: a course is removed.
  when: actions(
    [CourseRegistering.removeCourse, { courseId }, {}],
  ),
  // The where clause now finds the single item to be removed.
  where: async (frames) => {
    // We query to see if this 'courseId' exists as a ranked 'item'.
    // This will return either one frame (if found) or zero frames (if not).
    // The input parameter is `item` and we pass `courseId`.
    // The output is also `item`, which we can ignore as we already have courseId.
    return await frames.query(Ranking._findRankedItem, { item: courseId }, { item: courseId });
  },
  // The 'then' clause will run at most once.
  then: actions(
    // We call the new 'removeItem' action, passing the courseId.
    [Ranking.removeItem, { item: courseId }],
  ),
});
```

By modifying the `Ranking` concept to directly enforce the business rule, the entire system becomes cleaner. The synchronizations are simpler to write and understand because they no longer need to handle a one-to-many relationship, reflecting the new one-to-one reality.
