---
timestamp: 'Tue Nov 18 2025 22:23:48 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251118_222348.7e4bf0a0.md]]'
content_id: 739eb14a32568aa9fcfb18bee362a2cb9f905b70251a987507456da8238c5034
---

# response:

You've hit on a core aspect of how the synchronization engine processes data!

Yes, at its heart, the engine works with an internal representation that can be conceptualized as **arrays of dictionaries** (or more precisely, `Frames` which are arrays where each element is a `Record<symbol, unknown>`). This is highly action/query dependent, as these operations are precisely what manipulate this array of frames.

Let's break it down:

### The Nature of `Frames`

1. **What `Frames` are:** As the documentation states, `Frames` is an array-like object where each element (a "frame") is a `Record<symbol, unknown>`. Think of each frame as a dictionary that holds a specific set of variable bindings. The keys of these dictionaries are `Symbol`s, not strings, corresponding to the variables you destructure (`{ count, user }`).

2. **`when` clause generates initial `Frames`:** When the `when` clause matches one or more actions in the system's history, it generates an initial set of `Frames`. Each frame in this set contains the variable bindings extracted from the matched action patterns. If multiple action patterns are specified, the engine finds combinations that occurred in the same "flow" and binds all relevant variables into single frames.

   * Example: `when: actions([Button.clicked, { kind: "increment_counter", user }, {}])`
     * If `Button.clicked` occurs with `user: "Alice"`, the initial `Frames` will be `[{ [user]: "Alice" }]`.

3. **`where` clause manipulates `Frames`:** The `where` clause is where the "array of dictionaries" concept is most active.
   * It takes an input `Frames` object.
   * `frames.query()`: This method is crucial. For *each frame* in the input `Frames`, it executes a concept query.
     * If a query returns *multiple results* for a single input frame (e.g., `Comment._getByTarget` returning multiple comments for one post), it effectively **expands** that single frame into multiple new frames, each containing the original bindings plus one of the query results.
     * If a query returns *no results* for an input frame, that frame is **removed** from the `Frames` object.
   * `frames.filter()`: This method works exactly like `Array.prototype.filter`. It iterates over each frame and keeps only those for which the provided callback function returns `true`. This **reduces** the number of frames.
   * `frames.collectAs()`: This method takes multiple frames and **reduces** them into fewer frames by grouping and collecting specified variables into an array within a single frame.
   * The `where` clause ultimately **returns a new `Frames` object**.

4. **`then` clause consumes `Frames`:** The actions in the `then` clause are executed **once for each frame** that remains in the `Frames` object returned by the `where` clause.
   * For each frame, the variables bound within that frame are used to fill in the parameters of the `then` actions.

### In summary:

* **"Arrays of Dictionaries"**: Yes, this is an accurate mental model for how data flows through the `where` clause. Each "dictionary" is a `Frame` holding variable bindings, and the `Frames` object is an array of these.
* **"Action/Query Dependent"**: Absolutely.
  * The `when` clause determines the initial set of variables and frames.
  * `query` methods in the `where` clause can significantly alter the number of frames (expanding or contracting) and the bindings within each frame.
  * `filter` methods strictly reduce the number of frames.
  * `collectAs` methods reduce the number of frames and transform bindings into an array within a single frame.

***

### Sample Sync Spec (When/Where/Then)

Let's illustrate this with an example that finds all posts by a specific user that have more than a certain number of likes, and then sends those popular posts back in a response.

**Assumed Concepts (simplified for illustration):**

```typescript
// src/concepts/User.ts
export const User = {
  _getById: (id: string) => ({ user: Symbol() }),
};

// src/concepts/Post.ts
export const Post = {
  _getPostsByAuthor: (author: Symbol) => ({ post: Symbol(), title: string }),
  _getLikes: (post: Symbol) => ({ likes: number }),
};

// src/concepts/Requesting.ts
export const Requesting = {
  request: (path: string, userId?: string, minLikes?: number) => ({ request: Symbol() }),
  respond: (request: Symbol, body: any) => {},
};
```

**Synchronization Specification (Conceptual `sync` format):**

```sync
sync GetPopularUserPosts

when
    Requesting.request (path: "/api/popular-posts", userId, minLikes) : (request)

where
    // Get the actual user object from the ID
    in User: _getById (userId) gets user

    // Find all posts by this user
    in Post: _getPostsByAuthor (author: user) gets (post, title)

    // For each post, get its number of likes
    in Post: _getLikes (post) gets likes

    // Keep only posts with likes above the threshold
    likes >= minLikes

    // Collect the post and title information
    collect post, title as popularPosts

then
    Requesting.respond (request, body: { posts: popularPosts })
```

**TypeScript Implementation (`src/syncs/popularPosts.sync.ts`):**

```typescript
import { actions, Frames, Sync } from "@engine";
import { User, Post, Requesting } from "@concepts"; // Assuming these are defined and built

export const GetPopularUserPosts: Sync = ({
  request,        // From Requesting.request
  userId,         // From Requesting.request input
  minLikes,       // From Requesting.request input
  user,           // From User._getById output
  post,           // From Post._getPostsByAuthor output
  title,          // From Post._getPostsByAuthor output
  likes,          // From Post._getLikes output
  popularPosts,   // Collected variable for the response
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/api/popular-posts", userId, minLikes },
      { request },
    ],
  ),
  where: async (frames) => {
    // 1. Initial frames (from `when` clause match):
    //    [{ [request]: sym1, [userId]: "userA_id", [minLikes]: 5 }]

    // 2. Query for the actual user object using userId
    frames = await frames.query(User._getById, { id: userId }, { user });
    //    [{ [request]: sym1, [userId]: "userA_id", [minLikes]: 5, [user]: symUserA }]

    // 3. Query for all posts by this user. This might EXPAND the frames!
    //    If userA has postP1 and postP2, this becomes:
    frames = await frames.query(
      Post._getPostsByAuthor,
      { author: user },
      { post, title },
    );
    //    [
    //      { ..., [user]: symUserA, [post]: symP1, [title]: "Post 1 Title" },
    //      { ..., [user]: symUserA, [post]: symP2, [title]: "Post 2 Title" },
    //    ]

    // 4. For each post, query its likes.
    frames = await frames.query(
      Post._getLikes,
      { post },
      { likes },
    );
    //    [
    //      { ..., [post]: symP1, [title]: "Post 1 Title", [likes]: 12 },
    //      { ..., [post]: symP2, [title]: "Post 2 Title", [likes]: 3 },
    //    ]

    // 5. Filter frames based on `minLikes` condition
    frames = frames.filter(($) => $[likes] >= $[minLikes]);
    //    If minLikes was 5, symP2 is filtered out:
    //    [
    //      { ..., [post]: symP1, [title]: "Post 1 Title", [likes]: 12 },
    //    ]

    // 6. Collect the desired post data into the `popularPosts` variable
    return frames.collectAs([post, title], popularPosts);
    //    [
    //      {
    //        [request]: sym1,
    //        [userId]: "userA_id",
    //        [minLikes]: 5,
    //        [user]: symUserA,
    //        [popularPosts]: [{ post: symP1, title: "Post 1 Title" }]
    //      }
    //    ]
  },
  then: actions(
    [
      Requesting.respond,
      {
        request,
        body: { posts: popularPosts }, // Use the collected `popularPosts`
      },
    ],
  ),
});
```

This example demonstrates how `Frames` (arrays of dictionaries) are:

* Initialized by the `when` clause.
* Expanded by queries (`Post._getPostsByAuthor`).
* Enriched with new bindings by queries (`Post._getLikes`).
* Filtered (`frames.filter`).
* Reduced and restructured (`frames.collectAs`).
* Ultimately consumed by the `then` clause to fire actions with the final bindings.
