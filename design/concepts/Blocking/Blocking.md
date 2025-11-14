*   **concept**: Blocking [User]
*   **purpose**: To empower users to prevent specific individuals from viewing their information, even if they are in a shared group or context.
*   **principle**: If User A blocks User B, then even if they are both members of the same group, any application feature that tries to show User A's schedule to User B will fail or show nothing.
*   **state**:
    `blockList: a set of (blocker: User, blocked: User)`
*   **actions**:
    `blockUser (blocker: User, userToBlock: User)`
      **requires** The pair (`blocker`, `userToBlock`) is not already in the `blockList`. `blocker` is not `userToBlock`.
      **effects** Adds the pair (`blocker`, `userToBlock`) to the `blockList`.

    `unblockUser (blocker: User, userToUnblock: User)`
      **requires** The pair (`blocker`, `userToUnblock`) exists in the `blockList`.
      **effects** Removes the pair (`blocker`, `userToUnblock`) from the `blockList`.

    **quieres**
    `_isUserBlocked(primaryUser: User, secondaryUser: User)`
      **effects** Returns ture if (primaryUser, secondaryUser) pair exists in blockList, false otherwise
