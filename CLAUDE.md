# Neighbour Alerts - Project Instructions

## 1. Project Overview

Neighbour Alerts is a location-based community safety web application.

The application allows users to:

- View nearby incidents on an interactive map.
- Report safety incidents.
- View incident details.
- View their current location.
- See a route/polyline from their location to a selected incident.
- View analytics and safety-related information.
- Use the application on desktop and mobile devices.

The project is currently primarily a React/Vite frontend application.

Before making any changes, inspect the actual repository and understand the existing implementation.

---

# 2. IMPORTANT: Inspect Before Modifying

Before modifying or creating files:

1. Inspect the complete repository structure.
2. Read the relevant existing source files.
3. Understand the current routing system.
4. Understand the current component architecture.
5. Understand the current context/state-management architecture.
6. Understand the existing map implementation.
7. Understand existing API/service files.
8. Understand the current authentication implementation.
9. Check the existing dependencies in package.json.

Do not assume that files, folders, components, or services exist.

Do not blindly follow a proposed architecture if it conflicts with the actual repository.

---

# 3. Protect Existing Functionality

The existing user-facing application contains working functionality.

Do not unnecessarily:

- Rewrite existing components.
- Delete existing components.
- Replace working functionality.
- Change the existing map implementation without a clear reason.
- Change the existing styling system unnecessarily.
- Install duplicate dependencies.

Before modifying an existing file, understand how it is currently used.

After making changes, verify that the existing user-facing application still works.

---

# 4. Admin Dashboard Architecture

The admin dashboard should be added inside the existing React frontend.

Do not create a second React frontend project.

The preferred admin section is:

src/admin/

The exact internal structure should be determined after inspecting the existing repository.

A possible structure is:

src/admin/
├── components/
├── layouts/
├── pages/
├── services/
└── data/

The admin dashboard may include:

- Admin login.
- Admin overview dashboard.
- Incident management.
- Incident details.
- User management.
- Admin incident map.
- Analytics.
- Settings.

The admin dashboard should be visually consistent with the Neighbour Alerts application while maintaining a professional administrative interface.

---

# 5. Admin Dashboard Development Phase

The first phase is frontend-only.

Do not build the backend yet unless explicitly requested.

Initially, use realistic mock data.

The admin frontend should be architected so that mock data can later be replaced with real backend API calls without rewriting the UI.

Prefer an API abstraction layer such as:

src/admin/services/adminApi.js

Possible functions include:

- getAdminStats()
- getAdminIncidents()
- getAdminIncidentById(id)
- getAdminUsers()
- updateIncidentStatus(id, status)
- deleteIncident(id)

Initially, these functions may use mock data.

Later, they will be replaced with real API requests.

UI components should communicate with the API/service abstraction instead of directly depending on hardcoded data whenever practical.

---

# 6. Admin Dashboard Features

## Overview Dashboard

Include:

- Total users.
- Total incidents.
- Pending incidents.
- Verified incidents.
- Resolved incidents.
- Incidents reported today.
- Recent incidents.
- Incident trends over time.
- Incidents by category.
- Incidents by severity.

---

## Incident Management

The admin should be able to view and manage incidents.

Incident information may include:

- Incident ID.
- Title.
- Category.
- Description.
- Location.
- Reporter.
- Severity.
- Status.
- Created date.
- Attached images, if available.

Supported statuses may include:

- Pending.
- Under Review.
- Verified.
- Resolved.
- Rejected.

Possible actions:

- View incident.
- Verify incident.
- Reject incident.
- Change incident status.
- Mark incident as resolved.
- Delete incident.

During the frontend-only phase, these actions may update local mock state.

---

## Incident Details

The incident details page should contain:

- Complete incident information.
- Reporter information.
- Incident location.
- Map representation.
- Severity.
- Current status.
- Status history or timeline.
- Administrative actions.

---

## Admin Incident Map

The admin map should display incidents and support useful filtering.

Possible filters:

- Category.
- Severity.
- Status.
- Date.
- Location.

The existing map technology and project conventions should be reused where appropriate.

Do not introduce a new mapping library unnecessarily.

---

## User Management

The admin should be able to:

- View users.
- Search users.
- Filter users.
- View user details.
- See the number of incidents reported by a user.
- See account status.
- Suspend users.
- Delete users.

Use mock data during the frontend-only phase.

---

## Analytics

The analytics section may include:

- Incidents over time.
- Incidents by category.
- Incidents by severity.
- Most affected areas.
- Incident resolution statistics.
- User reporting activity.

Reuse the chart library already present in the project whenever possible.

---

# 7. Routing

The admin dashboard should have a separate route namespace.

Possible routes include:

/admin/login
/admin/dashboard
/admin/incidents
/admin/incidents/:id
/admin/users
/admin/map
/admin/analytics
/admin/settings

Before implementing routes, inspect the existing routing architecture and integrate with it instead of replacing it.

---

# 8. Future Backend Architecture

The future application should use one shared backend for:

1. Normal users.
2. Administrators.

Do not create separate user and admin backends.

The future backend may include:

- Authentication.
- User management.
- Incident management.
- Admin authorization.
- Analytics.
- Notifications.
- Socket.io real-time functionality.

Admin access must eventually be protected using backend authentication and role-based authorization.

Frontend route protection alone is not sufficient for security.

---

# 9. UI/UX Requirements

The admin dashboard should:

- Be responsive.
- Work on desktop, tablet, and mobile.
- Use reusable components.
- Have a consistent navigation layout.
- Include a mobile-friendly navigation system.
- Include loading states.
- Include empty states.
- Include error states.
- Include confirmation dialogs for destructive actions.
- Include toast notifications where appropriate.
- Match the existing Neighbour Alerts design language.

Do not make the interface unnecessarily complicated.

---

# 10. Code Quality

- Reuse existing components where appropriate.
- Avoid unnecessary duplication.
- Keep components focused.
- Follow the existing project's coding conventions.
- Follow the existing styling approach.
- Reuse existing dependencies where possible.
- Do not install a new dependency if an existing dependency can solve the problem.
- Keep imports clean.
- Avoid unused code.
- Avoid unnecessary abstractions.

---

# 11. Development Workflow

For every major task:

## Step 1: Inspect

First inspect the relevant existing files and architecture.

## Step 2: Plan

Explain:

- What files will be created.
- What files will be modified.
- Why the changes are needed.
- How the changes integrate with the existing architecture.

## Step 3: Implement

Make the smallest clean implementation necessary.

## Step 4: Verify

Check:

- Broken imports.
- Unused imports.
- Routing errors.
- Build errors.
- Existing user functionality.
- Responsive behavior.

## Step 5: Report

Summarize:

- Files created.
- Files modified.
- Important architectural decisions.
- Testing performed.
- Any remaining issues.

---

# 12. Important Rule

Do not implement large changes based only on assumptions.

Always inspect the actual repository first.

If the existing architecture differs from this document, prioritize the actual working codebase and explain the difference before making major architectural changes.
