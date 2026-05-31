# People vs Users — Architectural Distinction

## The Two Concepts

### `people` table
- **Purpose**: Lightweight directory / assignment entities.
- Represents humans who can be:
  - Assigned tasks
  - Added as meeting attendees
  - Referenced in workflows, tickets, etc.
- Can be internal team members, client employees, vendors, contractors, etc.
- **Do not grant any login or data access** by themselves.
- Live under a specific `project_id` (and therefore under a client).

### `user` + `user_clients`
- **Purpose**: Authentication + Authorization principals.
- These are real accounts that can log into the dashboard.
- Access to specific clients is controlled exclusively via the `user_clients` join table.
- Internal team members (`@datadrivensr.com` or `isAdmin = true`) bypass client restrictions.

## How They Relate

- `people.user_id` (nullable) → Optional enrichment link to a real `user`.
- When linked, it allows nice UI treatment:
  - Showing that an assignee "has dashboard access"
  - Potentially pulling avatar / name from the user record
  - Future possibilities (e.g., "mention this person in comments" → notify them)

- A `person` record does **not** need a corresponding `user`.
  - Most imported assignees from old tasks/emails will remain as pure `people` records forever.

## Recommended Lifecycle (Updated for Your Use Case)

Since most `people` records represent employees or vendors of your clients whom you plan to give dashboard access:

1. **Import / Create assignments**:
   - Freely create `people` records when ingesting tasks, meetings, etc.
   - These people do not have accounts yet.

2. **Giving access (recommended flow)**:
   - In the People tab for a client, select one or more people.
   - Send invites (the backend now supports bulk `personIds`).
   - This creates proper `user` + `user_clients` rows for the correct client.
   - On acceptance, the system automatically links the `people` record to the new `user` (via `user_id`).

3. **For existing data**:
   - Use the admin backfill endpoint to link people who already have matching user accounts.
   - Then invite the remaining people through the proper flow.

4. **Auto-linking**:
   - Still runs on login as a safety net / enrichment.
   - Now respects the `user_clients` membership model.

## Why This Separation Matters

- Keeps the system clean as you grow the number of clients.
- External vendors and one-off contacts can be assigned work without ever having accounts.
- Real access control stays simple and auditable (only `user` + `user_clients`).
- Avoids accidentally giving people dashboard access just because they appeared in an imported task list.

## Current State (as of latest changes)

- The auto-link logic in `auth.js` and the admin backfill script have been updated to respect the `user_clients` membership model.
- `people` creation now has clear comments explaining the intended model.
- Authorization everywhere should go through `user` + `user_clients` (or internal admin bypass), never through `people`.

This is the model you should continue building toward.
