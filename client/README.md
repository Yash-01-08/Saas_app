# Orbit — SaaS Project Management Frontend

A React + Vite frontend wired to the Express backend routes in the supplied `server.zip`.

## Requirements

- Node.js 20.19+ (or a current Node.js LTS compatible with Vite 7)
- The backend running at `http://localhost:5000`
- MongoDB and Redis running for backend functionality
- AWS S3 configured on the backend for file upload/download features

## Setup

```bash
npm install
```

Copy `.env.example` to `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Backend integration included

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Organizations: create, join by invite code, list current user's organizations
- Workspaces: create, list by organization, list members
- Projects: create, list by workspace, update
- Tasks: create, list by project, update
- Sprints: create, list by project, start, complete
- Comments: create and list by task
- Notifications: list, unread count, mark read, mark all read
- Socket.IO: listens for `notification:new` using the same JWT returned by login
- S3: presigned upload, confirm, list project files, download and delete

## Important backend notes

1. Backend CORS uses `CLIENT_URL`. Set it to `http://localhost:5173` in the backend environment.
2. The backend registration endpoint requires `name`, `username`, `email`, `password`, `phone`, and `company`.
3. Login expects `username` and `password`, and returns a JWT in `token`.
4. S3 browser uploads require bucket CORS to allow `PUT` from `http://localhost:5173` and the `Content-Type` request header.
5. The backend route `/api/files/project/:projectId` is declared after `/:fileId/download-url`. It does not collide with the current two-segment download route, but placing static routes before generic parameter routes is clearer.
6. The backend currently exposes workspace members but no endpoint to search users or list organization members for adding someone. This UI displays current workspace members; member invitation/role editing is not included.
7. The backend does not currently expose a task detail endpoint. Task discussions and editing use the existing task routes.

## Notes

- The frontend stores the access token in `localStorage` and sends it as a Bearer token, matching the backend auth middleware.
- The project is built to integrate with the supplied backend contracts. Run `npm run build` to verify the production bundle.
- This ZIP contains source code, not `node_modules`. Install dependencies before running.
