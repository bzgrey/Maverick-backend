---
timestamp: 'Sun Nov 30 2025 10:03:39 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251130_100339.f763dfbf.md]]'
content_id: 9480b757af513f0c3cbd24c012b71ca84d6e293473bfaae809a92c768dab2f56
---

# trace:

The trace demonstrates the fulfillment of the **principle**: "A user creates a group, becomes its admin, manages membership, and can eventually delete it, while ensuring the group is never left without an admin."

```typescript
Deno.test("Principle: Group Lifecycle", async () => {
  console.log("\n# --- Principle Trace: Full Group Lifecycle --- #");
  const [db, client] = await testDb();
  
  // 1. Create initial users
  const alice = await createUser(db, "Alice");
  const bob = await createUser(db, "Bob");
  const charlie = await createUser(db, "Charlie");
  console.log(`[TRACE] Initial state: Users Alice, Bob, and Charlie exist.`);

  // 2. Alice creates a group, becoming the first admin.
  console.log("\n[TRACE] Action: Alice creates the 'Study Group'.");
  const group = await createGroup(db, {
      creatorId: alice.id,
      name: "Study Group",
      description: "For exam prep",
  });
  console.log(`[TRACE] Effect: 'Study Group' created. Verifying Alice is the sole admin.`);
  assertEquals(await countAdmins(db, group.id), 1);
  assertEquals(await isGroupAdmin(db, group.id, alice.id), true);

  // 3. Alice (admin) adds Bob and Charlie as members.
  console.log("\n[TRACE] Action: Alice adds Bob and Charlie to the group.");
  await addMember(db, { actorId: alice.id, groupId: group.id, userId: bob.id });
  await addMember(db, { actorId: alice.id, groupId: group.id, userId: charlie.id });
  const { rows } = await db.queryObject("SELECT * FROM group_members WHERE group_id = $1", [group.id]);
  console.log(`[TRACE] Effect: Group now has 3 members. Verifying...`);
  assertEquals(rows.length, 3);
  
  // 4. Alice promotes Bob to an admin.
  console.log("\n[TRACE] Action: Alice promotes Bob to admin.");
  await updateRole(db, { actorId: alice.id, groupId: group.id, userId: bob.id, newRole: "admin" });
  console.log(`[TRACE] Effect: Group now has two admins. Verifying...`);
  assertEquals(await countAdmins(db, group.id), 2);
  assertEquals(await isGroupAdmin(db, group.id, bob.id), true);
  
  // 5. Bob (now an admin) removes Charlie.
  console.log("\n[TRACE] Action: Bob, as an admin, removes Charlie.");
  await removeMember(db, { actorId: bob.id, groupId: group.id, userId: charlie.id });
  const { rows: membersAfterRemove } = await db.queryObject("SELECT * FROM group_members WHERE group_id = $1", [group.id]);
  console.log(`[TRACE] Effect: Group is back to 2 members. Verifying Charlie is gone...`);
  assertEquals(membersAfterRemove.length, 2);
  assertEquals(membersAfterRemove.find(m => m.user_id === charlie.id), undefined);

  // 6. Bob (admin) tries to remove Alice (the other admin), which should succeed.
  console.log("\n[TRACE] Action: Bob removes Alice from the group.");
  await removeMember(db, { actorId: bob.id, groupId: group.id, userId: alice.id });
  console.log(`[TRACE] Effect: Bob is now the last admin. Verifying...`);
  assertEquals(await countAdmins(db, group.id), 1);
  assertEquals(await isGroupAdmin(db, group.id, bob.id), true);

  // 7. Bob, as the last admin, tries to remove himself, which must fail to prevent an orphaned group.
  console.log("\n[TRACE] Action: Bob attempts to remove himself (the last admin).");
  const selfRemoveResult = await removeMember(db, { actorId: bob.id, groupId: group.id, userId: bob.id });
  console.log(`[TRACE] Effect: Action fails as required. Error: ${selfRemoveResult.error}`);
  assertExists(selfRemoveResult.error);
  assertEquals(await countAdmins(db, group.id), 1, "Admin count should not have changed.");

  // 8. Bob (admin) deletes the group.
  console.log("\n[TRACE] Action: Bob deletes the 'Study Group'.");
  await deleteGroup(db, { actorId: bob.id, groupId: group.id });
  const { rows: finalGroups } = await db.queryObject("SELECT * FROM groups WHERE id = $1", [group.id]);
  const { rows: finalMembers } = await db.queryObject("SELECT * FROM group_members WHERE group_id = $1", [group.id]);
  console.log("[TRACE] Effect: Group and its memberships are deleted. Verifying...");
  assertEquals(finalGroups.length, 0);
  assertEquals(finalMembers.length, 0);
  
  console.log("\n# --- Principle Trace Complete --- #");
  await client.close();
});
```
