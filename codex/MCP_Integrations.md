# MCP Integrations

**Purpose**: Third-party service integrations for code review, issue tracking, API access, and diagramming

**Integration Servers**: GitLab, Atlassian (Jira/Confluence), SQVR GraphQL, D2 Diagrams

---

## GitLab Integration

**Purpose**: Merge request (MR) operations and code review workflows

### Core Tools (3 Primary)

#### 1. create_merge_request

**Description**: Create new merge request in GitLab project.

**Key Parameters:**

- `project_id`: Project ID or URL-encoded path
- `source_branch`: Branch with changes
- `target_branch`: Base branch (usually main/master)
- `title`: MR title
- `description`: MR description (markdown supported)
- `assignee_ids`: User IDs to assign
- `reviewer_ids`: User IDs as reviewers

**Use Cases:**

- Automated MR creation after feature completion
- Batch MR creation for multiple related changes
- CI/CD pipeline integration

**Example:**

```
create_merge_request(
  project_id="my-org/my-project",
  source_branch="feature/auth-improvements",
  target_branch="main",
  title="Add JWT authentication",
  description="## Changes\n- Implement JWT tokens\n- Add refresh token logic"
)
```

---

#### 2. get_merge_request

**Description**: Retrieve merge request details and metadata.

**Key Parameters:**

- `project_id`: Project ID or URL-encoded path
- `merge_request_iid`: MR internal ID (IID, not global ID)

**Use Cases:**

- Check MR status before operations
- Retrieve MR metadata for analysis
- Monitor MR progress

**Example:**

```
get_merge_request(
  project_id="my-org/my-project",
  merge_request_iid="123"
)
→ Returns MR details, status, approvals, etc.
```

---

#### 3. get_merge_request_diffs

**Description**: Get changes/diffs for merge request with optional file filtering.

**Key Parameters:**

- `project_id`: Project ID or URL-encoded path
- `merge_request_iid`: MR internal ID
- `from`: Base branch/commit SHA
- `to`: Target branch/commit SHA
- `excluded_file_patterns`: Regex patterns to exclude files (e.g., `["^test/mocks/", "\\.spec\\.ts$"]`)

**Use Cases:**

- Code review analysis
- Change impact assessment
- Automated diff validation

**Example:**

```
get_merge_request_diffs(
  project_id="my-org/my-project",
  merge_request_iid="123",
  excluded_file_patterns=["package-lock\\.json", "^\\."]
)
→ Returns diffs excluding lock files and dotfiles
```

---

### Additional GitLab Tools

**Note**: Many additional GitLab tools exist beyond the core 3. Use MCPProxy's `retrieve_tools` for discovery:

- Thread/comment operations
- Draft note management
- Branch operations
- Commit operations
- Pipeline/CI operations
- File creation/updates
- Project management

**Discovery Pattern:**

```
retrieve_tools("gitlab merge request comments")
retrieve_tools("gitlab create branch")
retrieve_tools("gitlab commit file")
```

MCPProxy will automatically find relevant tools based on natural language query.

---

## Atlassian Integration (Jira/Confluence)

**Purpose**: Issue tracking, sprint management, documentation access

**⚠️ CRITICAL: Economical Usage Required**

### Usage Philosophy

- **Minimize Requests**: Combine operations when possible
- **Don't Overload**: Avoid excessive API calls
- **Be Specific**: Use precise JQL queries
- **Cache Results**: Don't repeatedly fetch same data

### Core Tools (4 Primary)

#### 1. getJiraIssue

**Description**: Retrieve specific Jira issue by key.

**Key Parameters:**

- `issueKey`: Jira issue key (e.g., "PROJ-123")
- `expand`: Additional fields to include (e.g., "changelog", "comments")

**Use Cases:**

- Check issue status
- Retrieve issue details for context
- Analyze issue history

**Example:**

```
getJiraIssue(issueKey="AUTH-456")
→ Returns issue details, status, assignee, etc.
```

**Best Practice**: Fetch only needed fields, avoid excessive expansion.

---

#### 2. searchJiraIssuesUsingJql

**Description**: Search Jira issues using JQL (Jira Query Language).

**Key Parameters:**

- `jql`: JQL query string
- `maxResults`: Limit result count (default: 50)
- `fields`: Specific fields to return (reduces payload)

**Use Cases:**

- Find related issues
- Sprint planning queries
- Status/priority filtering

**Example:**

```
searchJiraIssuesUsingJql(
  jql="project = AUTH AND status = 'In Progress' AND assignee = currentUser()",
  maxResults=10,
  fields=["summary", "status", "assignee"]
)
→ Returns current user's in-progress auth issues
```

**Best Practice**:

- Use specific JQL to minimize results
- Limit `maxResults` to what you need
- Request only necessary `fields`

---

#### 3. atlassianUserInfo

**Description**: Get current authenticated user information.

**Use Cases:**

- Verify authentication
- Get user ID for assignments
- Check user permissions

**Example:**

```
atlassianUserInfo()
→ Returns current user details
```

---

#### 4. getAccessibleAtlassianResources

**Description**: List accessible Atlassian resources (sites, projects).

**Use Cases:**

- Discover available projects
- Check access permissions
- Initialize integration

**Example:**

```
getAccessibleAtlassianResources()
→ Returns accessible Jira/Confluence sites
```

---

### Atlassian Best Practices

**Token Economy:**

- ✅ Batch related queries when possible
- ✅ Use JQL filters to reduce result size
- ✅ Request specific fields, not all data
- ✅ Cache results within session
- ❌ Don't repeatedly fetch same issue
- ❌ Don't fetch without specific need
- ❌ Don't use overly broad JQL queries

**Efficiency Rules:**

1. One targeted query > multiple broad queries
2. Specific fields > all fields
3. Limited results > unlimited results
4. JQL filtering > post-query filtering

---

## SQVR GraphQL Integration

**Purpose**: API access to SQVR system via GraphQL

**⚠️ CRITICAL: Granular Atomic Queries REQUIRED**

### The Schema Problem

**Challenge**: SQVR GraphQL schema is **ENORMOUS**

- Thousands of types, fields, relationships
- Easy to hit token limits with large queries
- Full schema introspection is prohibitively expensive

**Solution**: **Surgical, Precise, Atomic Operations**

### Critical Rules

1. **⚠️ ALWAYS Granular Queries**: Request minimum data per operation
2. **⚠️ NEVER Full Schema Introspection**: Introspect only specific types/fields needed
3. **⚠️ ALWAYS Use Filters**: Filter at query level, not post-processing
4. **⚠️ ALWAYS Use Pagination**: Limit, offset, or cursor-based pagination
5. **⚠️ ALWAYS Select Specific Fields**: Never use `{ ... }` or request all fields

### Core Tools (2)

#### 1. query-graphql

**Description**: Execute GraphQL query against SQVR API.

**Key Parameters:**

- `query`: GraphQL query string
- `variables`: Query variables (JSON object)
- `operationName`: Operation name for multi-operation documents

**Use Cases:**

- Fetch specific entity data
- Execute mutations
- Query relationships

**Best Practice Examples:**

**❌ WRONG - Too Broad:**

```graphql
query {
  users {
    id name email
    profile { ... }  # Fetches everything
    posts { ... }    # Fetches everything
  }
}
```

**✅ RIGHT - Surgical:**

```graphql
query GetUserEmail($userId: ID!) {
  user(id: $userId) {
    email
  }
}
```

**Token Optimization Rule**: Multiple small queries > one large query
_Example_: `query GetUser + query GetPosts` (2×1K tokens) > `query AllUserData` (5K tokens)

---

#### 2. introspect-schema

**Description**: Introspect GraphQL schema structure.

**⚠️ DANGER**: Full introspection hits token limits easily!

**Key Parameters:**

- `typename`: Specific type to introspect (ALWAYS use this!)
- `includeDeprecated`: Include deprecated fields (default: false)

**Best Practice:**

**❌ WRONG - Full Schema:**

```
introspect-schema()  // Requests ENTIRE schema - DANGER!
```

**✅ RIGHT - Specific Type:**

```
introspect-schema(typename="User")  // Only User type
introspect-schema(typename="Post")  // Only Post type
```

**Workflow for Unknown Schema:**

```
1. introspect-schema(typename="Query")
   → See available root queries
2. introspect-schema(typename="User")
   → See User fields
3. query-graphql(query="{ user(id: 1) { id name } }")
   → Execute targeted query
```

---

### SQVR Best Practices

**Query Strategy:**

1. **Start Minimal**: Request absolute minimum fields
2. **Iterate**: Add fields only as needed
3. **Paginate Everything**: Always use `first`, `last`, `limit`
4. **Filter at Source**: Use GraphQL filters, not post-query filtering
5. **One Concern Per Query**: Don't combine unrelated queries

**Introspection Strategy:**

1. **Never Full Schema**: Always specify `typename`
2. **Top-Down**: Start with `Query`/`Mutation`, drill down
3. **Just-In-Time**: Introspect only when needed for specific operation
4. **Cache Mentally**: Remember structure, don't re-introspect

**Token Economy Examples:**

| Approach                    | Token Cost      | Recommended    |
| --------------------------- | --------------- | -------------- |
| Full schema introspection   | ~50K+ tokens    | ❌ Never       |
| Type-specific introspection | ~500-2K tokens  | ✅ When needed |
| Minimal field query         | ~100-500 tokens | ✅ Default     |
| Paginated query (limit=10)  | ~500-1K tokens  | ✅ Always      |
| Unpaginated broad query     | ~10K+ tokens    | ❌ Never       |

---

## D2 Diagrams Integration

**Purpose**: Create, export, and save D2 diagram files
**Priority**: Low (use only when diagramming explicitly requested)

**Tools**: `d2_create` (create from DSL), `d2_export` (to image format), `d2_save` (persist to file)

**When to Use**: Architecture documentation, visual system design, user explicitly requests diagrams
**When NOT**: Default docs (use markdown), simple explanations (text sufficient)

---

## Integration Selection Matrix

| Need                 | Use                                  | Avoid                         |
| -------------------- | ------------------------------------ | ----------------------------- |
| Code review workflow | GitLab MR tools                      | Fetching all MRs              |
| Issue status check   | Jira getIssue                        | Searching without JQL         |
| Sprint planning      | Jira JQL search                      | Broad queries                 |
| API data fetch       | SQVR query-graphql (granular!)       | Full schema introspection     |
| Entity details       | SQVR query-graphql (specific fields) | Fetching all fields           |
| Architecture diagram | D2 tools                             | Using for simple explanations |

---

## Key Insights

**GitLab:**

- Focus on core 3 tools (MR operations)
- Use MCPProxy `retrieve_tools` for additional functionality
- Minimal, targeted operations

**Atlassian/Jira:**

- **Economy is critical** - minimize API calls
- Specific JQL queries with field selection
- Batch operations when possible

**SQVR GraphQL:**

- **Granular atomic queries** - non-negotiable
- **Never full schema introspection** - specify types
- Pagination, filtering, field selection always
- Token limits hit easily - be surgical

**D2 Diagrams:**

- Low priority, use only when needed
- Good for architecture docs
- Not for default documentation

**General Rule**: More specific query = fewer tokens = better performance
