---
timestamp: 'Sun Nov 23 2025 14:08:15 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251123_140815.c18130f7.md]]'
content_id: 523a367c75fd1f29c07ca0d1a7436654c9a76a5563c3d498ecdc5eaf1fa30212
---

# API Specification: Friending Concept

**Purpose:** enable users to form bilateral connections to see each other's content

***

## API Endpoints

### POST /api/Friending/request

**Description:** Sends a friend request from one user to another.

**Requirements:**

* The `from` user is not the same as the `to` user.
* No friend request from `from` to `to` already exists.
* No friend request from `to` to `from` already exists.

**Effects:**

* Creates a new friend request with a "pending" status from the `from` user to the `to` user.

**Request Body:**

```json
{
  "from": "User",
  "to": "User"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Friending/accept

**Description:** Accepts a pending friend request, establishing a mutual friendship.

**Requirements:**

* The status of the given friend request is "pending".

**Effects:**

* Sets the status of the friend request to "accepted".

**Request Body:**

```json
{
  "request": "FriendRequest"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Friending/reject

**Description:** Rejects a pending friend request.

**Requirements:**

* The status of the given friend request is "pending".

**Effects:**

* Sets the status of the friend request to "rejected".

**Request Body:**

```json
{
  "request": "FriendRequest"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Friending/remove

**Description:** Removes an existing friendship between two users.

**Requirements:**

* An "accepted" friend request exists between `user1` and `user2`.

**Effects:**

* Deletes the friend request record that connects the two users.

**Request Body:**

```json
{
  "user1": "User",
  "user2": "User"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Friending/\_getFriends

**Description:** Retrieves a list of all friends for a given user.

**Requirements:**

* The specified `user` must exist.

**Effects:**

* Returns an array of users who have an "accepted" friendship with the given user.

**Request Body:**

```json
{
  "user": "User"
}
```

**Success Response Body (Query):**

```json
[
  {
    "friend": "User"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Friending/\_getIncomingRequests

**Description:** Retrieves all pending friend requests sent to a specific user.

**Requirements:**

* The specified `user` must exist.

**Effects:**

* Returns an array of all "pending" friend requests where the `to` field matches the given user.

**Request Body:**

```json
{
  "user": "User"
}
```

**Success Response Body (Query):**

```json
[
  {
    "request": "FriendRequest"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Friending/\_getOutgoingRequests

**Description:** Retrieves all pending friend requests sent by a specific user.

**Requirements:**

* The specified `user` must exist.

**Effects:**

* Returns an array of all "pending" friend requests where the `from` field matches the given user.

**Request Body:**

```json
{
  "user": "User"
}
```

**Success Response Body (Query):**

```json
[
  {
    "request": "FriendRequest"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
