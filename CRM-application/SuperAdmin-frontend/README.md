# SHNOOR CRM - Super Admin Dashboard

This version has a denser, more natural admin dashboard with larger text.

## Sidebar
- Overview
- Organizations
- Users
- Subscriptions
- Analytics
- Audit Logs
- Support
- Settings

## Overview
- Log out button
- Platform status
- Four KPI cards
- Recent organizations
- Support queue
- Quick actions
- Subscription mix
- Recent activity

No login page is included. Authentication is expected to come from the existing application.

The Overview log out button clears browser storage and redirects to `/login`.
Replace that handler with your colleague's existing auth logout function when integrating.

## Run

```bash
npm install
npm run dev
```
