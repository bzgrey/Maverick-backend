# Concept: Ranking [User, Item]

*   **concept**: Ranking \[User, Item]
*   **purpose**: To allow users to assign a personal numerical score to a set of items, and to query these scores.
*   **principle**: Each user can assign at most one score to any given item. The concept maintains the relationship between users, items, and the scores they have assigned.
*   **state**:
    *   A set of `Ranks` with
        *   a `user` of type `User`
        *   an `item` of type `Item`
        *   a `score` of type `Number`
*   **actions**:
    *   `setScore (user: User, item: Item, score: Number): (rank: Rank)`
        *   **requires**: `score` must be a valid number.
        *   **effects**: Creates and returns a new `Rank` record linking the `user` and `item` with the given `score`. If a rank from that user for that item already exists, it is updated with the new score.
    *   `removeItem (item: Item)`
        *   **requires**: The item must be a valid identifier.
        *   **effects**: Removes **all** `Rank` records associated with the given `item`, regardless of the user who created them. This is typically used for cleanup when an item is deleted from another system.
*   **queries**:
    *   `_getRanksByItem (item: Item): (rank: Rank)`
        *   **purpose**: To find all individual rank records associated with a specific item. This is crucial for cleanup operations (used by `removeItem`) or for fetching all data for aggregation.
        *   **inputs**: `item` - The identifier of the item to look up.
        *   **outputs**: `rank` - Zero or more `Rank` record identifiers associated with the given `item`.
    *   `_getRanksByUser (user: User): (item: Item, score: Number)`
        *   **purpose**: To retrieve all the scores a specific user has submitted.
        *   **inputs**: `user` - The identifier of the user.
        *   **outputs**: `item`, `score` - Zero or more pairs of items and the scores the user assigned to them.
    *   `_getScoreForUserAndItem (user: User, item: Item): (score: Number)`
        *   **purpose**: To retrieve the specific score a single user gave to a single item.
        *   **inputs**: `user` - The user identifier. `item` - The item identifier.
        *   **outputs**: `score` - The numerical score, if one exists. Returns at most one result.