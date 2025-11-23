# API Specification: Friending Concept

[@api-extraction-from-code](../../tools/api-extraction-from-code.md)

[@api-extraction-from-spec](../../tools/api-extraction-from-spec.md)

Friending Specs: [@Friending](Friending.md)

Friending Code: [@implementation](implementation.md)

# make api specs for Friending concept using the specs and code implementation. make inputs match


# response:

# API Specification: Friending Concept

**Purpose:** To allow users to form mutual, symmetric connections.

---

## API Endpoints

### POST /api/Friending/request

**Description:** Sends a friend request from one user to another.

**Requirements:**
- The `from` user is not the same as the `to` user.
- A friend request does not already exist between the two users in either direction.
- The two users are not already friends.

**Effects:**
- Creates a new pending friend request from the `from` user to the `to` user and returns its ID.

**Request Body:**
```json
{
  "from": "string (ID)",
  "to": "string (ID)"
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
---
### POST /api/Friending/accept

**Description:** Accepts an existing friend request, creating a friendship.

**Requirements:**
- The specified friend request must exist.

**Effects:**
- Creates a mutual friendship between the two users involved in the request.
- Deletes the original friend request.

**Request Body:**
```json
{
  "requester": "string (ID)",
  "requestee": "string (ID)"
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
---
### POST /api/Friending/reject

**Description:** Rejects and deletes an existing friend request.

**Requirements:**
- The specified friend request must exist.

**Effects:**
- Deletes the original friend request.

**Request Body:**
```json
{
  "requester": "string (ID)",
  "requestee": "string (ID)"
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
---
### POST /api/Friending/remove

**Description:** Removes an existing friendship between two users.

**Requirements:**
- A friendship must exist between user `u1` and user `u2`.

**Effects:**
- Deletes the friendship between the two users.

**Request Body:**
```json
{
  "u1": "string (ID)",
  "u2": "string (ID)"
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
---
### POST /api/Friending/_areFriends

**Description:** Checks if two users are friends.

**Requirements:**
- Both user `u1` and `u2` must exist.

**Effects:**
- Returns a boolean indicating whether a friendship exists between the two users.

**Request Body:**
```json
{
  "u1": "string (ID)",
  "u2": "string (ID)"
}
```

**Success Response Body (Query):**
```json
[
  {
    "areFriends": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/Friending/_getFriends

**Description:** Retrieves a list of all friends for a given user.

**Requirements:**
- The specified user must exist.

**Effects:**
- Returns an array containing the IDs of all users who are friends with the specified user.

**Request Body:**
```json
{
  "user": "string (ID)"
}
```

**Success Response Body (Query):**
```json
[
  {
    "friend": "string (ID)"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/Friending/_getIncomingRequests

**Description:** Retrieves all pending friend requests sent to a given user.

**Requirements:**
- The specified user must exist.

**Effects:**
- Returns an array of all friend requests where the specified user is the recipient.

**Request Body:**
```json
{
  "user": "string (ID)"
}
```

**Success Response Body (Query):**
```json
[
  {
    "request": "string (ID)"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/Friending/_getOutgoingRequests

**Description:** Retrieves all pending friend requests sent by a given user.

**Requirements:**
- The specified user must exist.

**Effects:**
- Returns an array of all friend requests where the specified user is the sender.

**Request Body:**
```json
{
  "user": "string (ID)"
}
```

**Success Response Body (Query):**
```json
[
  {
    "request": "string (ID)"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---