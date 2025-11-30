---
timestamp: 'Sun Nov 30 2025 11:04:39 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251130_110439.97ad7293.md]]'
content_id: 4fe0da8a9e43f4395217cfcacfccdcfe5038ed0ca4f4673298a1c676205093be
---

# concept: Sessioning \[User]

* **purpose**: To maintain a user's logged-in state across multiple requests without re-sending credentials.
* **principle**: After a user is authenticated, a session is created for them. Subsequent requests using that session's ID are treated as being performed by that user, until the session is deleted (logout).
* **state**:
  * a set of `Session`s with
    * a `user` User
* **actions**:
  * `create (user: User): (session: Session)`
    * **requires**: true.
    * **effects**: creates a new Session `s`; associates it with the given `user`; returns `s` as `session`.
  * `delete (session: Session): ()`
    * **requires**: the given `session` exists.
    * **effects**: removes the session `s`.
* **queries**:
  * `_getUser (session: Session): (user: User)`
    * **requires**: the given `session` exists.
    * **effects**: returns the user associated with the session.

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
