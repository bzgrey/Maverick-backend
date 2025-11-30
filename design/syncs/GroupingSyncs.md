# Grouping Syncs

## `src/syncs/grouping/create_group.sync.ts`

```sync
sync CreateGroupRequest
when
	Requesting.request (path: "/groups/create", session, groupName: string) : (request)
where
	Sessioning._getUser (session): (user)
then
	Grouping.createGroup (user, groupName)

sync CreateGroupResponse
when
	Requesting.request (path: "/groups/create", session, groupName: string) : (request)
	Grouping.createGroup (user, groupName) : (group)
then
	Requesting.respond (request, group)

sync CreateGroupError
when
	Requesting.request (path: "/groups/create", session, groupName: string) : (request)
	Grouping.createGroup (user, groupName) : (error)
then
	Requesting.respond (request, error)
```

***

## `src/syncs/grouping/add_member.sync.ts`

```sync
sync AddMemberRequest
when
	Requesting.request (path: "/groups/addMember", session, group, member: User) : (request)
where
	Sessioning._getUser (session): (user)
	Grouping._isGroupAdmin (group, user): (isAdmin: bool) // where true
	Grouping._isGroupMember (group, member): (isMember: bool) // where false
then
	Grouping.addMember (group: group, member)

sync AddMemberResponse
when
	Requesting.request (path: "/groups/addMember", session, group, member: User) : (request)
	Grouping.addMember (group: group, member)
then
	Requesting.respond (request)

sync AddMemberError
when
	Requesting.request (path: "/groups/addMember", session, group, member: User) : (request)
	Grouping.addMember (group: group, member): (error)
then
	Requesting.respond (request, error)
```

***

## `src/syncs/grouping/remove_member.sync.ts`

```sync
sync RemoveMemberRequest
when
	Requesting.request (path: "/groups/removeMember", session, group, member: User) : (request)
where
	Sessioning._getUser (session): (user)
	Grouping._isGroupAdmin (group, user): (isAdmin: bool) // where true
	Grouping._isGroupMember (group, member): (isMember: bool) // where true
then
	Grouping.removeMember (group, member)

sync RemoveMemberResponse
when
	Requesting.request (path: "/groups/removeMember", session, group, member: User) : (request)
	Grouping.removeMember (group, member)
then 
	Requesting.respond (request)

sync RemoveMemberError
when
	Requesting.request (path: "/groups/removeMember", session, group, member: User) : (request)
	Grouping.removeMember (group, member): (error)
then 
	Requesting.respond (request, error)

```

***

## `src/syncs/grouping/delete_group.sync.ts`

```sync
sync DeleteGroupRequest
when
	Requesting.request (path: "/groups/delete", session, group) : (request)
where
	Sessioning._getUser (session): (user)
	Grouping._isGroupAdmin (group, user): (isAdmin: bool)
then
	Grouping.deleteGroup (group: group)

sync DeleteGroupResponse
when
	Requesting.request (path: "/groups/delete", session, group) : (request)
	Grouping.deleteGroup (group: group)
then
	Requesting.respond (request)

sync DeleteGroupError
when
	Requesting.request (path: "/groups/delete", session, group) : (request)
	Grouping.deleteGroup (group: group): (error)
then
	Requesting.respond (request, error)
```

***

## `src/syncs/grouping/get_group_members.sync.ts`

```sync
sync GetGroupMembersRequest
when
	Requesting.request (path: "/groups/members", session, group) : (request)
where
	Sessioning._getUser (session): (user)
	Grouping._isGroupMember (group, user) : (inGroup: bool) // where bool is true
	Grouping._getMembers (group): (members: set of User)
	Blocking._isUserBlocked(member, user): (bool) // where bool is false
  frames.collectAs([member], results);
then
	Requesting.respond (request, results)
```

***

## `src/syncs/grouping/get_my_groups.sync.ts`

```sync
sync GetMyGroupsRequest
when
	Requesting.request (path: "/groups/my-groups", session) : (request)
where
	Sessioning._getUser (session): (user)
	Grouping._getUserGroups (user): (groups: set of Group)
then
	Requesting.repond (request, groups)
```