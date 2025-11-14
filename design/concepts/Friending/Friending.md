*   **concept**: Friending [User]
*   **purpose**: To manage mutual, consent-based social connections between users.
*   **principle**: If User A sends a friend request to User B, and User B accepts the request, then User A and User B will appear on each other's friends list.
*   **state**:
    `pendingRequests: a set of (requester: User, requestee: User)`
    `friends: a set of {user1: User, user2: User}` (a symmetric relationship)
*   **actions**:
    `requestFriend (requester: User, requestee: User)`
      **requires** `requester` and `requestee` are not already friends. A pending request from `requester` to `requestee` does not already exist. `requester` is not `requestee`.
      **effects** Adds the pair (`requester`, `requestee`) to the `pendingRequests` set.

    `acceptFriend (requester: User, requestee: User)`
      **requires** A pending request from `requester` to `requestee` exists in pendingRequests.
      **effects** Removes the pair (`requester`, `requestee`) from `pendingRequests`. Adds the pair `{requester, requestee}` to the `friends` set.

    `rejectFriend (requester: User, requestee: User)`
      **requires** A pending request from `requester` to `requestee` exists in pendingRequests.
      **effects** Removes the pair (`requester`, `requestee`) from `pendingRequests`.

    `removeFriend (remover: User, removed: User)`
      **requires** `remover` and `removed` are friends.
      **effects** Removes the pair `{remover, removed}` from the `friends` set.
