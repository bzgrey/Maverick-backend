---
timestamp: 'Sun Nov 30 2025 10:03:39 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251130_100339.f763dfbf.md]]'
content_id: 538ebb755f69be2a062c81a59a6f6032af5602d82c2226fdaf794273a618aff6
---

# file: src/grouping/groupingConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";

// --- Mock Action Implementations (for testing purposes) ---
// In a real application, these would be imported from './groupingActions.ts'

/** A simple user record. */
type User = { id: string; name: string };
/** A group record. */
type Group = { id: string; name: string; description: string };
/** A group membership record. */
type GroupMember = {
  group_id: string;
  user_id: string;
  role: "admin" | "member";
};

// Helper to check if a user is an admin
async function isGroupAdmin(db: any, groupId: string, userId: string): Promise<boolean> {
  const { rows } = await db.queryObject<GroupMember>(
    "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
    [groupId, userId],
  );
  return rows.length > 0 && rows[0].role === "admin";
}

// Helper to count admins in a group
async function countAdmins(db: any, groupId: string): Promise<number> {
    const { rows } = await db.queryObject<{ count: string }>(
      "SELECT COUNT(*) FROM group_members WHERE group_id = $1 AND role = 'admin'",
      [groupId],
    );
    return parseInt(rows[0]?.count ?? "0", 10);
}


// Mock Action: create
async function createGroup(db: any, { creatorId, name, description }: { creatorId: string, name: string, description: string }) {
  if (!name) return { error: "Group name cannot be empty." };
  const { rows: users } = await db.queryObject("SELECT id FROM users WHERE id = $1", [creatorId]);
  if (users.length === 0) return { error: "Creator does not exist." };

  const { rows: groups } = await db.queryObject<Group>(
    "INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING *",
    [name, description],
  );
  const newGroup = groups[0];

  await db.queryObject(
    "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'admin')",
    [newGroup.id, creatorId],
  );

  return newGroup;
}

// Mock Action: addMember
async function addMember(db: any, { actorId, groupId, userId, role = "member" }: { actorId: string, groupId: string, userId: string, role?: "admin" | "member" }) {
  if (!await isGroupAdmin(db, groupId, actorId)) return { error: "Actor is not an admin." };

  const { rows: existing } = await db.queryObject("SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = $2", [groupId, userId]);
  if (existing.length > 0) return { error: "User is already a member." };
  
  const { rows: members } = await db.queryObject<GroupMember>(
    "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) RETURNING *",
    [groupId, userId, role]
  );
  return members[0];
}

// Mock Action: removeMember
async function removeMember(db: any, { actorId, groupId, userId }: { actorId: string, groupId: string, userId: string }) {
    if (!await isGroupAdmin(db, groupId, actorId)) return { error: "Actor is not an admin." };

    const { rows: members } = await db.queryObject<GroupMember>("SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2", [groupId, userId]);
    if (members.length === 0) return { error: "User is not a member of this group." };

    if (members[0].role === 'admin' && await countAdmins(db, groupId) === 1) {
        return { error: "Cannot remove the last admin." };
    }

    const { rows: deleted } = await db.queryObject<GroupMember>(
        "DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING *",
        [groupId, userId]
    );
    return deleted[0];
}

// Mock Action: updateRole
async function updateRole(db: any, { actorId, groupId, userId, newRole }: { actorId: string, groupId: string, userId: string, newRole: "admin" | "member" }) {
    if (!await isGroupAdmin(db, groupId, actorId)) return { error: "Actor is not an admin." };

    const { rows: members } = await db.queryObject<GroupMember>("SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2", [groupId, userId]);
    if (members.length === 0) return { error: "User is not a member of this group." };

    if (members[0].role === 'admin' && newRole === 'member' && await countAdmins(db, groupId) === 1) {
        return { error: "Cannot demote the last admin." };
    }

    const { rows: updated } = await db.queryObject<GroupMember>(
        "UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3 RETURNING *",
        [newRole, groupId, userId]
    );
    return updated[0];
}

// Mock Action: delete
async function deleteGroup(db: any, { actorId, groupId }: { actorId: string, groupId: string }) {
    if (!await isGroupAdmin(db, groupId, actorId)) return { error: "Actor is not an admin." };

    await db.queryObject("DELETE FROM group_members WHERE group_id = $1", [groupId]);
    const { rows: deleted } = await db.queryObject<Group>("DELETE FROM groups WHERE id = $1 RETURNING *", [groupId]);
    return deleted[0];
}


// --- Helper Functions for Seeding Data ---

async function createUser(db: any, name: string): Promise<User> {
  const { rows } = await db.queryObject<User>(
    "INSERT INTO users (name) VALUES ($1) RETURNING *",
    [name],
  );
  return rows[0];
}

// --- Test Suite ---

Deno.test("Grouping Concept", async (t) => {
  // Setup: Create two users for testing roles
  const [db, client] = await testDb();
  const alice = await createUser(db, "Alice");
  const bob = await createUser(db, "Bob");

  let testGroup: Group;

  await t.step("Action: create", async (t) => {
    await t.step("requires: creator must exist", async () => {
        console.log("\n  -> Testing create: non-existent creator should fail");
        const result = await createGroup(db, {
          creatorId: "non-existent-user-id",
          name: "Ghost Group",
          description: "A group that cannot be created",
        });
        console.log("     Action returned:", result);
        assertExists(result.error);
        assertEquals(result.error, "Creator does not exist.");
    });
    
    await t.step("requires: name must not be empty", async () => {
        console.log("\n  -> Testing create: empty name should fail");
        const result = await createGroup(db, {
          creatorId: alice.id,
          name: "",
          description: "A group with no name",
        });
        console.log("     Action returned:", result);
        assertExists(result.error);
        assertEquals(result.error, "Group name cannot be empty.");
    });

    await t.step("effects: creates group and adds creator as admin", async () => {
        console.log("\n  -> Testing create: valid creation");
        const group = await createGroup(db, {
            creatorId: alice.id,
            name: "Book Club",
            description: "A club for reading books",
        });
        console.log("     Action returned:", group);
        
        // Effect 1: Group is created
        const { rows: groups } = await db.queryObject("SELECT * FROM groups WHERE id = $1", [group.id]);
        assertEquals(groups.length, 1);
        assertEquals(groups[0].name, "Book Club");
        
        // Effect 2: Creator is an admin
        const isAdmin = await isGroupAdmin(db, group.id, alice.id);
        assertEquals(isAdmin, true);
        console.log(`     Verified: Group '${group.name}' created and Alice is an admin.`);
        
        testGroup = group; // Save for subsequent tests
    });
  });

  await t.step("Action: addMember", async (t) => {
    await t.step("requires: actor must be an admin", async () => {
        console.log("\n  -> Testing addMember: non-admin actor should fail");
        const charlie = await createUser(db, "Charlie");
        // Bob is not yet in the group, so he can't be an admin.
        const result = await addMember(db, { actorId: bob.id, groupId: testGroup.id, userId: charlie.id });
        console.log("     Action returned:", result);
        assertExists(result.error);
        assertEquals(result.error, "Actor is not an admin.");
    });

    await t.step("requires: user is not already a member", async () => {
        console.log("\n  -> Testing addMember: adding existing member should fail");
        // Alice is already a member (the admin).
        const result = await addMember(db, { actorId: alice.id, groupId: testGroup.id, userId: alice.id });
        console.log("     Action returned:", result);
        assertExists(result.error);
        assertEquals(result.error, "User is already a member.");
    });

    await t.step("effects: adds user to group with 'member' role", async () => {
        console.log("\n  -> Testing addMember: admin adds new user");
        const result = await addMember(db, { actorId: alice.id, groupId: testGroup.id, userId: bob.id });
        console.log("     Action returned:", result);
        
        const { rows: members } = await db.queryObject<GroupMember>("SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2", [testGroup.id, bob.id]);
        assertEquals(members.length, 1);
        assertEquals(members[0].role, "member");
        console.log("     Verified: Bob was successfully added to the group as a member.");
    });
  });

  await t.step("Action: updateRole", async (t) => {
    await t.step("requires: cannot demote the last admin", async () => {
        console.log("\n  -> Testing updateRole: demoting the last admin should fail");
        // At this point, Alice is the only admin.
        const result = await updateRole(db, { actorId: alice.id, groupId: testGroup.id, userId: alice.id, newRole: "member" });
        console.log("     Action returned:", result);
        assertExists(result.error);
        assertEquals(result.error, "Cannot demote the last admin.");
    });

    await t.step("effects: promotes a member to admin", async () => {
        console.log("\n  -> Testing updateRole: Alice promotes Bob to admin");
        const result = await updateRole(db, { actorId: alice.id, groupId: testGroup.id, userId: bob.id, newRole: "admin" });
        console.log("     Action returned:", result);

        const isAdmin = await isGroupAdmin(db, testGroup.id, bob.id);
        assertEquals(isAdmin, true);
        console.log("     Verified: Bob is now an admin.");
    });
  });

  await t.step("Action: removeMember", async (t) => {
    await t.step("requires: cannot remove the last admin", async () => {
        console.log("\n  -> Testing removeMember: removing the last admin should fail");
        // First, let's demote Alice so Bob is the only admin
        await updateRole(db, { actorId: bob.id, groupId: testGroup.id, userId: alice.id, newRole: "member" });
        console.log("     Setup: Bob demoted Alice to member. Bob is now the sole admin.");

        const result = await removeMember(db, { actorId: alice.id, groupId: testGroup.id, userId: bob.id }); // Alice (member) tries to remove Bob (last admin)
        assertExists(result.error, "A non-admin should not be able to remove anyone");

        const result2 = await removeMember(db, { actorId: bob.id, groupId: testGroup.id, userId: bob.id }); // Bob (last admin) tries to remove himself
        console.log("     Action returned:", result2);
        assertExists(result2.error);
        assertEquals(result2.error, "Cannot remove the last admin.");
        
        // Restore Alice's admin status for subsequent tests
        await updateRole(db, { actorId: bob.id, groupId: testGroup.id, userId: alice.id, newRole: "admin" });
    });

    await t.step("effects: removes a member from the group", async () => {
        console.log("\n  -> Testing removeMember: admin removes another member");
        const charlie = await createUser(db, "Charlie");
        await addMember(db, { actorId: alice.id, groupId: testGroup.id, userId: charlie.id });
        console.log("     Setup: Charlie added to group.");

        const result = await removeMember(db, { actorId: alice.id, groupId: testGroup.id, userId: charlie.id });
        console.log("     Action returned:", result);

        const { rows: members } = await db.queryObject("SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = $2", [testGroup.id, charlie.id]);
        assertEquals(members.length, 0);
        console.log("     Verified: Charlie was successfully removed from the group.");
    });
  });

  await t.step("Action: delete", async (t) => {
    await t.step("requires: actor must be an admin", async () => {
        console.log("\n  -> Testing delete: non-admin actor should fail");
        // Demote alice so we can test with a non-admin
        await updateRole(db, { actorId: bob.id, groupId: testGroup.id, userId: alice.id, newRole: "member" });
        const result = await deleteGroup(db, { actorId: alice.id, groupId: testGroup.id });
        console.log("     Action returned:", result);
        assertExists(result.error);
        assertEquals(result.error, "Actor is not an admin.");
        // Restore admin status
        await updateRole(db, { actorId: bob.id, groupId: testGroup.id, userId: alice.id, newRole: "admin" });
    });

    await t.step("effects: deletes the group and all memberships", async () => {
        console.log("\n  -> Testing delete: admin deletes the group");
        const result = await deleteGroup(db, { actorId: alice.id, groupId: testGroup.id });
        console.log("     Action returned:", result);
        assertNotEquals(result.error, "Actor is not an admin.");
        
        // Effect 1: Group is gone
        const { rows: groups } = await db.queryObject("SELECT * FROM groups WHERE id = $1", [testGroup.id]);
        assertEquals(groups.length, 0);

        // Effect 2: Memberships are gone
        const { rows: members } = await db.queryObject("SELECT * FROM group_members WHERE group_id = $1", [testGroup.id]);
        assertEquals(members.length, 0);

        console.log("     Verified: Group and all associated memberships were deleted.");
    });
  });

  // Finally, close the database connection
  await client.close();
});
```
