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
where
	Sessioning._getUser (session): (user)
then
	Requesting.respond (request, group)

sync CreateGroupError
when
	Requesting.request (path: "/groups/create", session, groupName: string) : (request)
	Grouping.createGroup (user, groupName) : (error: string)
where
	Sessioning._getUser (session): (user)
then
	Requesting.respond (request, error)
```

***

## `src/syncs/grouping/add_member.sync.ts`

sync RemoveMemberRequest
when
	Requesting.request (path: "/groups/removeMember", session, group, member: User) : (request)
where
	Sessioning._getUser (session): (user)
	Grouping._isGroupAdmin (group, user): (isAdmin: bool) // where true
	Grouping._isGroupMember (group, member): (isMember: bool) // where true
then
	Grouping.removeMember (group, member)
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
where
	Sessioning._getUser (session): (user)
	Grouping._isGroupAdmin (group, user): (isAdmin: bool) // where true
	Grouping._isGroupMember (group, member): (isMember: bool) // where false
then
	Requesting.respond (request, "success")

sync AddMemberError
when
	Requesting.request (path: "/groups/addMember", session, group, member: User) : (request)
	Grouping.addMember (group: group, member): (error: string)
where
	Sessioning._getUser (session): (user)
	Grouping._isGroupAdmin (group, user): (isAdmin: bool) // where true
	Grouping._isGroupMember (group, member): (isMember: bool) // where false
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
	Sessioning._getUser (session): (user)
	Grouping._isGroupAdmin (group, user): (isAdmin: bool) // where true
	Grouping._isGroupMember (group, member): (isMember: bool) // where true
	Grouping.removeMember (group, member)
then 
	Requesting.respond (request, "success")

sync RemoveMemberResponse
when
	Sessioning._getUser (session): (user)
	Grouping._isGroupAdmin (group, user): (isAdmin: bool) // where true
	Grouping._isGroupMember (group, member): (isMember: bool) // where true
	Grouping.removeMember (group, member) : (error: string)
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
	Requesting.request (path: "/groups/delete") : (request)
	Grouping._isGroupAdmin (group, user): (isAdmin: bool)
	Grouping.deleteGroup (group: group)
then
	Requesting.respond (request, "success")

sync DeleteGroupError
when
	Requesting.request (path: "/groups/delete") : (request)
	Grouping._isGroupAdmin (group, user): (isAdmin: bool)
	Grouping.deleteGroup (group: group): (error: string)
then
	Requesting.respond (request, error)
```

***

## `src/syncs/grouping/get_group_members.sync.ts`

```sync
sync GetGroupMembersRequest
when
	Requesting.request (path: "/groups/members", session: String, group) : (request)
where
	Sessioning._getUser (session): (user)
	Grouping._isGroupMember (group, user) : (inGroup: bool) // where bool is true
then
	Grouping._getMembers (group): (members: set of User)

sync GetGroupMembersResponse
when
	Requesting.request (path: "/groups/members", session: String, group) : (request)
where
	Sessioning._getUser (session): (user)
	Grouping._isGroupMember (group, user) : (inGroup: bool) // where bool is true
	Grouping._getMembers (group): (members: set of User)
	Blocking._isUserBlocked (member of members, user): (bool) // for frames where user isn't blocked
then
	Requesting.respond (request, members) // filtered removing members blocking user

sync GetGroupMembersError
when
	Requesting.request (path: "/groups/members") : (request)
	Grouping._isGroupMember (group, user) : (inGroup: bool) // where bool is true
	Grouping._getMembers (group): (error: string)
then
	Requesting.respond (request, error)
```

***

## `src/syncs/grouping/get_my_groups.sync.ts`

```sync
sync GetMyGroupsRequest
when
	Requesting.request (path: "/groups/my-groups", session: string) : (request)
where
	Sessioning._getUser (session): (user)
then
	Grouping._getUserGroups (user): (groups: set of Group)

sync GetMyGroupsResponse
when
	Requesting.request (path: "/groups/my-groups", session: string) : (request)
	Sessioning._getUser (session): (user)
	Grouping._getUserGroups (user): (groups: set of Group)
then
	Requesting.respond (request, groups)

sync GetMyGroupsError
when
	Requesting.request (path: "/groups/my-groups", session: string) : (request)
	Sessioning._getUser (session): (user)
	Grouping._getUserGroups (user): (error: string)
then
	Requesting.respond (request, error)
```