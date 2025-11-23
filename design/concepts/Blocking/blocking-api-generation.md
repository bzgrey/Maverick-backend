# API Specification: Blocking Concept

[@api-extraction-from-code](../../tools/api-extraction-from-code.md)

[@api-extraction-from-spec](../../tools/api-extraction-from-spec.md)

Blocking Specs: [@Blocking](Blocking.md)

Blocking Code: [@implementation](implementation.md)

# Please extract an API specs for the Blocking concept




# response:

# API Specification: Blocking Concept

**Purpose:** Allow a user to prevent another user or entity from interacting with them or their content.

---

## API Endpoints

### POST /api/Blocking/block

**Description:** Allows a user to block a specific target.

**Requirements:**
- The `user` must not be the same as the `target`.
- The `user` must not have already blocked the `target`.

**Effects:**
- Adds the `target` to the `user`'s set of blocked targets.

**Request Body:**
```json
{
  "user": "User",
  "target": "Target"
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
### POST /api/Blocking/unblock

**Description:** Allows a user to unblock a previously blocked target.

**Requirements:**
- The `user` must have already blocked the `target`.

**Effects:**
- Removes the `target` from the `user`'s set of blocked targets.

**Request Body:**
```json
{
  "user": "User",
  "target": "Target"
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
### POST /api/Blocking/_isBlocked

**Description:** Checks if a user has blocked a specific target.

**Requirements:**
- The `user` and `target` must exist.

**Effects:**
- Returns `true` if the `user` has blocked the `target`, otherwise returns `false`.

**Request Body:**
```json
{
  "user": "User",
  "target": "Target"
}
```

**Success Response Body (Query):**
```json
[
  {
    "isBlocked": "boolean"
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
### POST /api/Blocking/_getBlocked

**Description:** Retrieves a list of all targets that a user has blocked.

**Requirements:**
- The `user` must exist.

**Effects:**
- Returns the set of all targets blocked by the `user`.

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
    "target": "Target"
  },
  {
    "target": "Target"
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