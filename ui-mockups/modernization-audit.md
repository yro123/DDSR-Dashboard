# DDSR UI Modernization Audit

## Scope Reviewed

- App shell and routing: `src/App.jsx`, `src/components/Layout.jsx`
- Global styling and tokens: `src/index.css`, `src/App.css`
- Core pages: `Tasks`, `Hub`, `Meetings`, `Requests`, `Review`, `Search`, `Admin`
- Admin tabs: Meetings, People, Documents, Project Settings, Config, Clients, Users
- Shared UI: Avatar, Pill, Modal, ConfirmDialog, Toast, filters, bulk bars, edit forms

## Current State

The app already has strong functional coverage for client project management: task tracking, Kanban, process workflows, meeting notes, client requests, admin setup, user access, and AI/email review. The main UI issue is not missing capability; it is consistency and polish.

Key gaps:

- Too many inline styles across pages, which makes components feel related but not unified.
- Layout differs between normal pages and Admin, so the app feels like two products.
- Filters, buttons, badges, forms, and cards vary by page.
- Task list density is useful, but hierarchy could be sharper: title, assignee, due date, workflow, status, source, confidence.
- Client names should remain workspace context only. The visual brand should be DDSR/DataDriven.

## Proposed Direction

Use a restrained professional operations-app design:

- DDSR logo in the app shell with brand blue, green, and navy as the primary palette.
- A single app shell for workspace pages and admin pages.
- A prominent client/project switcher in the sidebar or topbar.
- A global search field that covers tasks, meetings, requests, and people.
- Reusable primitives for `PageHeader`, `Toolbar`, `MetricCard`, `DataTable`, `StatusBadge`, `FilterChip`, `ActionButton`, `DetailsDrawer`, and `EmptyState`.
- Right-side details drawer for task edit, request approval, and meeting detail workflows.
- Compact tables/lists for repeated operational work; cards only for grouped items and Kanban cards.

## Mockup File

Open this file in a browser:

`ui-mockups/modern-ddsr-webapp-mockups.html`

It includes:

- UI audit overview
- Modern Tasks list
- Kanban board
- Process Hub
- Meeting notes timeline
- Client Requests
- Admin console
- Light/dark theme toggle

## Implementation Priority

1. Normalize design tokens in `src/index.css` around DDSR brand colors.
2. Extract shared shell and toolbar components from `Layout.jsx` and Admin.
3. Replace page-level inline button, filter, pill, and form styles with shared classes/components.
4. Upgrade Tasks first because it is the highest-use surface.
5. Apply the same component system to Hub, Meetings, Requests, Review/Search, then Admin.

