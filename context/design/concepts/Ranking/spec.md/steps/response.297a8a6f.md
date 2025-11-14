---
timestamp: 'Fri Nov 14 2025 13:17:34 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251114_131734.5aabf771.md]]'
content_id: 297a8a6fe35c29cde925f9563664bf5a12400b071bd44bea20a3563f89e6bad2
---

# response:

Of course. Based on the synchronizations created, especially the `CleanupRanksOnCourseRemoval` sync, we can infer the necessary query for the `Ranking` concept.

To make the concept fully consistent with the syncs, I will first update its definition slightly to reflect the more detailed actions (`setRank` with a user, `delete` with a rank object) and then add the `queries` section.

***

### Updated Concept: Ranking

The original `Ranking` concept was very generic. The syncs imply a more detailed structure where a `User` ranks an `Item`. Here is an updated specification that is more robust and directly supports the queries needed by our synchronizations.

* **concept**: Ranking \[User, Item]
* **purpose**: To allow users to assign a numerical rank to specific items.
* **principle**: A user can assign or update a numerical rank for an item. These ranks can be retrieved or removed. When an item is removed from another system, its associated ranks should also be removed.
* **state**:
  * A set of `Ranks`, where each `Rank` has:
    * a `user` of type `User`
    * an `item` of type `Item`
    * a `rankValue` of type `Number`
* **actions**:
  * `setRank (user: User, item: Item, rank: Number)`
    * **requires**: `rank` must be a valid number.
    * **effects**: Creates a new `Rank` record linking the user and item with the given rank. If a rank from that user for that item already exists, it is updated.
    * **returns**: `(rank: Rank)` — The created or updated rank record/identifier.
  * `delete (rank: Rank)`
    * **requires**: The `Rank` record must exist.
    * **effects**: Removes the specified `Rank` record from the state.
* **queries**:
  * `_getRanksByCourse (courseId: Item): (rank: Rank)`
    * **purpose**: To find all rank records associated with a specific item (in this context, a course). This is crucial for cleanup operations.
    * **inputs**: `courseId` - The identifier of the item to look up.
    * **outputs**: `rank` - Zero or more `Rank` record identifiers associated with the given `courseId`.

### Rationale for the Query

The query `_getRanksByCourse` is directly derived from the `where` clause of the `CleanupRanksOnCourseRemoval` synchronization:

```typescript
// From the sync's `where` clause:
where: async (frames) => {
    return await frames.query(Ranking._getRanksByCourse, { courseId }, { rank });
},
```

This line of code explicitly calls a query on the `Ranking` concept with the following characteristics:

1. **Name**: `Ranking._getRanksByCourse`. The underscore prefix is a common convention for queries intended for internal, inter-concept communication rather than direct user exposure.
2. **Input Pattern**: `{ courseId }`. This tells us the query function expects a single input parameter named `courseId` (which we map to the generic `Item` type in the concept spec).
3. **Output Pattern**: `{ rank }`. This indicates that the query returns a set of results, and for each result, the value is bound to a variable named `rank`. In the concept spec, this corresponds to the `Rank` record/identifier.
