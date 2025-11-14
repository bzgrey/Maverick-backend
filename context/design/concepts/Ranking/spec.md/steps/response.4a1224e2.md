---
timestamp: 'Fri Nov 14 2025 13:23:16 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251114_132316.e4daa9ff.md]]'
content_id: 4a1224e296bbfd09914ef364ce56ba58077cb8f1ecf7538847531343d5c246dd
---

# response:

Of course. This is a crucial part of the design. A ranking concept isn't useful unless you can query the results.

Adding queries allows other parts of the system—and end-users via API requests—to retrieve the ranked list, see the top items, or check a specific item's score.

Here is the updated `Ranking` concept specification, now including a robust set of queries, followed by examples of how they would be used in synchronizations.

***

### Updated Concept: Ranking (with Queries)

* **concept**: Ranking \[Item]
* **purpose**: To maintain an ordered list of items, where each item has a single, canonical numerical score.
* **principle**: An item can be assigned a score. If a score is set or updated for an item, its position in any ordered retrieval is adjusted. An item can only have one score at a time.
* **state**:
  * A mapping from `Item` to its `score` of type `Number`.
* **actions**:
  * `setScore (item: Item, score: Number)`
    * **requires**: `score` must be a valid number.
    * **effects**: Assigns or updates the score for the given item.
    * **returns**: `(item: Item, score: Number)` — The item and its new score.
  * `removeItem (item: Item)`
    * **requires**: The item must exist in the ranking.
    * **effects**: Removes the item and its associated score.
* **queries**:
  * `_findRankedItem (item: Item): (item: Item)`
    * **purpose**: To determine if a specific item exists within the ranking system.
    * **inputs**: `item` - The identifier of the item to look up.
    * **outputs**: `item` - The identifier of the item if found.
  * `_getScoreForItem (item: Item): (score: Number)`
    * **purpose**: To retrieve the specific score for a single item.
    * **inputs**: `item` - The identifier of the item to look up.
    * **outputs**: `score` - The numerical score of the item. Returns at most one result.
  * `_getTopItems (count: Number): (item: Item, score: Number)`
    * **purpose**: To retrieve the N highest-scoring items in descending order of score. This is the primary query for leaderboards.
    * **inputs**: `count` - The maximum number of items to return.
    * **outputs**: `item`, `score` - Zero or more pairs of items and their scores, sorted from highest to lowest score.
  * `_getAllSorted (order: "asc" | "desc"): (item: Item, score: Number)`
    * **purpose**: To retrieve all ranked items, sorted either ascending or descending.
    * **inputs**: `order` - (Optional, defaults to "desc") The sort order for the scores.
    * **outputs**: `item`, `score` - All ranked items and their scores in the specified order.

***

### Example Synchronizations Using the New Queries

These syncs show how to build API endpoints that expose the ranking data to users.

#### 1. Get the Top 5 Courses (Leaderboard)

This sync creates an API endpoint like `/leaderboard` that returns the top-ranked courses.

**Pseudo-Code:**

```sync
sync GetLeaderboard
when
    Requesting.request (path: "/leaderboard", count: 5) : (request)
where
    // Use the new query to get the top 5 items from the Ranking concept
    in Ranking: _getTopItems(count) gets (item, score)
    // Collect all the results into a single list
    results is collection of { item, score }
then
    // Respond to the original request with the list of results
    Requesting.respond (request, results)
```

**TypeScript Implementation (`src/syncs/leaderboard.sync.ts`):**

```typescript
import { actions, Sync } from "@engine";
import { Ranking, Requesting } from "@concepts";

/**
 * Handles a request to /leaderboard and returns the top-ranked items.
 * Demonstrates using a query and the `collectAs` helper to format a response.
 */
export const GetLeaderboard: Sync = ({ request, count, item, score, results }) => ({
  when: actions([
    // This could also be written to extract 'count' from the request if it's a query param
    Requesting.request, { path: "/leaderboard", count: 5 }, { request }
  ]),
  where: async (frames) => {
    // 1. Query the Ranking concept for the top items. This will create
    // multiple frames, one for each top-ranked item found.
    frames = await frames.query(Ranking._getTopItems, { count }, { item, score });
    
    // 2. Use `collectAs` to gather the `item` and `score` from all frames
    // into a single array named `results` in a single final frame.
    return frames.collectAs([item, score], results);
  },
  then: actions([
    // 3. Respond to the request with the collected results.
    Requesting.respond, { request, results }
  ]),
});
```

#### 2. Get the Specific Score for a Single Course

This sync creates an endpoint like `/courses/score/:courseId` to get the score for one course.

**Pseudo-Code:**

```sync
sync GetCourseScore
when
    Requesting.request (path: "/courses/score", courseId) : (request)
where
    // Find the score for just this one course
    in Ranking: _getScoreForItem(item: courseId) gets (score)
then
    // Respond with the courseId and its score
    Requesting.respond (request, courseId, score)
```

**TypeScript Implementation (`src/syncs/course_info.sync.ts`):**

```typescript
import { actions, Sync } from "@engine";
import { Ranking, Requesting } from "@concepts";

/**
 * Handles a request to get the score for a specific course.
 */
export const GetCourseScore: Sync = ({ request, courseId, score }) => ({
  when: actions([
    Requesting.request, { path: "/courses/score", courseId }, { request }
  ]),
  where: async (frames) => {
    // Query for the score of the specific item (courseId).
    // This will return at most one frame, with the 'score' binding.
    return await frames.query(Ranking._getScoreForItem, { item: courseId }, { score });
  },
  then: actions([
    // Respond with the original courseId and the score we found.
    // Note: If the where clause returns no frames, this 'then' will not fire,
    // and the request would time out. A more robust sync would handle the
    // "not found" case, as described in the "Common Pitfalls" section.
    Requesting.respond, { request, courseId, score }
  ]),
});
```

By adding these queries to the `Ranking` concept, you make it a fully-featured, reusable component. Any application can now drop it in, use `setScore` and `removeItem` to manage the data, and use `_getTopItems` or `_getScoreForItem` to easily build UIs and APIs around that data, all without altering the core concept itself.
