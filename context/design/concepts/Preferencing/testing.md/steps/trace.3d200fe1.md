---
timestamp: 'Thu Nov 20 2025 00:13:42 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251120_001342.4c0096cb.md]]'
content_id: 3d200fe155cbcee4d0e697da2bce564f290573d49548d4c5fa1bdd23f71dbbd3
---

# trace:

The principle for `Preferencing` is that "Each user can assign a score to at most one item at any given time. Assigning a score to an item (either new or existing) replaces any previously held item and score for that user."

The provided actions (`addScore`, `updateScore`, `removeScore`) model this principle through a specific sequence of operations. A user cannot simply add a new score if one already exists; they must first remove the old one. This makes the change of preference an explicit, multi-step process.

Here is a full trace demonstrating the principle:

1. **Initial State**: User `userA` has no preferences.
2. **Action**: `addScore({ user: userA, item: item1, score: 10 })`
   * **Result**: Success.
   * **State Change**: The database now records that `userA` has assigned `item1` a score of `10`.
   * **Verification**: `_getScore({ user: userA, item: item1 })` returns `{ score: 10 }`.
3. **Action**: User `userA` wants to change their preference to `item2` with a score of `8`. They attempt `addScore({ user: userA, item: item2, score: 8 })`.
   * **Result**: Failure, with an error like "User already has a scored item."
   * **State Change**: None. The state remains as it was after step 2.
   * **Verification**: This confirms the `requires` clause of `addScore` and forces an explicit removal first, upholding the "at most one item" rule.
4. **Action**: `removeScore({ user: userA, item: item1 })`
   * **Result**: Success.
   * **State Change**: The preference record for `userA` is deleted from the database.
   * **Verification**: `_getAllItems({ user: userA })` returns `{ items: [] }`.
5. **Action**: `addScore({ user: userA, item: item2, score: 8 })`
   * **Result**: Success.
   * **State Change**: A new record is created, assigning `item2` a score of `8` for `userA`.
   * **Verification**: `_getScore({ user: userA, item: item2 })` returns `{ score: 8 }`.
6. **Final State**: `userA` now has a single preference for `item2` with a score of `8`, successfully demonstrating that their preference was replaced.
