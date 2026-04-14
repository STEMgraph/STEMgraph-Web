# STEMgraph - Frontend Developer Documentation

## Overview

This repository contains the frontend of STEMgraph - an interactive 3D graph visualization of STEM learning exercises and their dependencies. The frontend is a vanilla JavaScript application served as static files via Nginx. It communicates with the STEMgraph REST API and uses Keycloak for authentication.

---

## Repository Structure

```
STEMgraph-Web/
- src/
  - main.js       Entry point - graph initialization, data loading, history management
  - auth.js       Keycloak integration, token management, role-based UI
  - events.js     UI event handling, modals, learning path management, analytics
  - config.js     Central configuration (API URL, Keycloak, colors, node sizes, keybindings)
- Dockerfile
- docker-compose.yml
- stemgraphlogo.svg
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| JavaScript (vanilla) | Application logic |
| Three.js | 3D geometry and rendering |
| ForceGraph3D | Force-directed 3D graph layout and interaction |
| Chart.js | Bar and doughnut charts in the analytics dashboard |
| Keycloak JS Adapter | OpenID Connect authentication |
| Nginx | Static file serving |
| Docker | Containerization |

---

## Local Development Setup

### Prerequisites

- Docker and Docker Compose
- A running STEMgraph API instance (see `Doc_Deployment.md`)
- A running Keycloak instance with realm `stemgraph` and client `stemgraph-web`

### 1. Clone the repositories

```bash
git clone https://github.com/STEMgraph/STEMgraph-Web.git
git clone https://github.com/STEMgraph/stemgraph-web-dev.git
```

### 2. Configure the frontend

Edit `STEMgraph-Web/src/config.js` and set the correct URLs:

```javascript
export const KEYCLOAK_BASE = 'https://<keycloak-url>/';
export const API_BASE = 'https://<api-url>';

export const KEYCLOAK_CONFIG = {
    url: KEYCLOAK_BASE,
    realm: 'stemgraph',
    clientId: 'stemgraph-web'
};
```

### 3. Start the development environment

The `stemgraph-web-dev` repository provides a local Nginx container that serves the frontend files directly from the working directory - no build step required.

```bash
cd stemgraph-web-dev
cp .env.example .env    # fill in DB credentials if needed
docker compose up
```

The frontend is then available at: http://localhost:8999

Any changes to files in `STEMgraph-Web/src/` are immediately reflected on reload (the directory is mounted as a volume).

---

## Configuration Reference

All configuration is centralized in `src/config.js`.

### API and Keycloak

```javascript
export const KEYCLOAK_BASE = 'https://<keycloak-url>/';
export const API_BASE = 'https://<api-url>';

export const KEYCLOAK_CONFIG = {
    url: KEYCLOAK_BASE,
    realm: 'stemgraph',
    clientId: 'stemgraph-web'
};

export const KEYCLOAK_INIT_OPTIONS = {
    onLoad: 'check-sso',       // silent SSO check on page load
    checkLoginIframe: false
};
```

### Node Colors

```javascript
export const NODE_COLORS = {
    start: "#4156cc",        // entry nodes (no dependencies)
    end: "#ff6600",          // exit nodes (not referenced by others)
    normal: "#888888",       // keyword cloud nodes
    finishedNode: "#75b3da", // lessons marked as completed
    todoNode: "#fdc075",     // lessons on the todo list
    default: "#e2e1e1"       // unvisited lessons
};
```

### Node Sizes and Graph Settings

```javascript
export const NODE_SIZES = {
    sphere: 5,
    cone: { radius: 5, height: 10, segments: 8 },
    box: 8,
    sphereSegments: 16,
    keywordSizeMultiplier: 4   // keyword node size scales with frequency
};

export const GRAPH_CONFIG = {
    linkDirectionalParticles: 3,
    linkDirectionalParticleWidth: 4,
    linkDirectionalParticleSpeed: 0.006,
    zoomDuration: 400,
    zoomPadding: 80,
    nodeOpacity: 0.85
};
```

### Keyboard Bindings

```javascript
export const KEYBINDINGS = {
    closeModal: 'Escape',
    zoomReset: ' ',
    goBack: 'ArrowLeft',
    goBackAlt: 'z',     // Ctrl+Z
    help: 'F1'
};
```

---

## Authentication

Authentication is handled in `src/auth.js` using the official Keycloak JavaScript adapter. The adapter is loaded via a `<script>` tag in the HTML (not via npm).

### Initialization

```javascript
keycloak.init(KEYCLOAK_INIT_OPTIONS).then(authenticated => { ... });
```

`check-sso` mode silently checks for an existing session on page load without forcing a redirect. The user remains unauthenticated if no active session exists.

### Token Handling

- The Keycloak token (`keycloak.token`) is passed as a `Bearer` token in the `Authorization` header for all authenticated API requests.
- Token refresh is handled automatically: `keycloak.onTokenExpired` triggers `keycloak.updateToken(5)` before expiry.

### Role-based UI

Roles are read from `keycloak.realmAccess?.roles`. The frontend applies three role levels:

| Role | UI behavior |
|---|---|
| (unauthenticated) | Read-only graph access, no progress tracking |
| `student` | Login required UI elements visible (Todo, Statistics, Logout) |
| `teacher` | Additionally: learning path management controls visible |
| `admin` | Additionally: analytics dashboard and full path management visible |

---

## API Endpoints Used by the Frontend

Base URL is configured in `config.js` as `API_BASE`.

### Public Endpoints (no token required)

| Method | Path | Used for |
|---|---|---|
| GET | `/getWholeGraph` | Initial graph load |
| GET | `/getStartNodes` | Identifying entry point nodes |
| GET | `/getEndNodes` | Identifying exit point nodes |
| GET | `/getExercise/{uuid}` | Loading a single node for path views |
| GET | `/getPathToExercise/{uuid}` | Loading all prerequisite nodes of a given node |
| GET | `/getExercisesByKeyword/{keyword}` | Keyword search (`?match=exact\|partial`) |
| GET | `/getKeywordList` | Populating the keyword autocomplete datalist |
| GET | `/getKeywordCount` | Building the keyword cloud |
| GET | `/getStatistics` | Statistics modal (total node count, keyword count) |
| GET | `/paths/{pathId}` | Loading a shared learning path by UUID |

### Authenticated Endpoints (Bearer token required)

| Method | Path | Used for |
|---|---|---|
| GET | `/users/{userId}/finished` | Loading the user's completed lessons on login |
| POST | `/users/{userId}/finished` | Marking a lesson as completed |
| DELETE | `/users/{userId}/finished/{nodeId}` | Unmarking a completed lesson |
| GET | `/users/{userId}/todo` | Loading the user's todo list on login |
| POST | `/users/{userId}/todo` | Adding a lesson to the todo list |
| DELETE | `/users/{userId}/todo/{nodeId}` | Removing a lesson from the todo list |
| POST | `/events` | Tracking user events (link_open, finished, todo_add, todo_remove, path_load) |

### Teacher / Admin Endpoints (Bearer token + role required)

| Method | Path | Used for |
|---|---|---|
| GET | `/paths` | Listing own paths (admin: all paths) |
| POST | `/paths` | Creating a new learning path |
| PUT | `/paths/{pathId}` | Renaming a path |
| DELETE | `/paths/{pathId}` | Deleting a path |
| POST | `/paths/{pathId}/nodes` | Adding a node to a path |
| DELETE | `/paths/{pathId}/nodes/{nodeId}` | Removing a node from a path |
| PUT | `/paths/{pathId}/nodes/reorder` | Reordering nodes within a path |
| GET | `/events` | Analytics - event type overview |
| GET | `/events?type=users` | Analytics - active user counts |
| GET | `/events?type=link_open` | Analytics - top opened lessons |
| GET | `/events?type=finished` | Analytics - top finished lessons |
| GET | `/events?type=path_load` | Analytics - top loaded paths |

### Admin-only Endpoints (Bearer token + admin role required)

| Method | Path | Used for |
|---|---|---|
| POST | `/refreshDatabase` | Trigger GitHub re-scan and graph rebuild (background task) |

---

## Node Visualization

Node shapes and colors carry semantic meaning and are rendered using Three.js geometry objects.

### Shapes

| Shape | Three.js Geometry | Meaning |
|---|---|---|
| Cone | `ConeGeometry` | Entry node - no dependencies |
| Box | `BoxGeometry` | Exit node - not referenced by any other node |
| Sphere (standard size) | `SphereGeometry` | Regular lesson node |
| Sphere (scaled by frequency) | `SphereGeometry` | Keyword in the keyword cloud |

### Colors

| Color | Hex | Meaning |
|---|---|---|
| Blue | `#4156cc` | Entry node |
| Orange | `#ff6600` | Exit node |
| Light blue | `#75b3da` | Lesson completed by the current user |
| Yellow-orange | `#fdc075` | Lesson on the current user's todo list |
| Light grey | `#e2e1e1` | Unvisited lesson |

---

## Graph Navigation History

The frontend maintains a navigation history of API URLs in `graphHistory` (also persisted to `localStorage`). Each `loadGraph()` call pushes the URL to the stack. The back button and keyboard shortcut pop the stack and reload the previous graph state.

---

## URL Parameters

The frontend supports deep-linking via URL query parameters on page load:

| Parameter | Example | Behavior |
|---|---|---|
| `keyword` | `?keyword=syscall` | Loads the keyword-filtered graph on startup |
| `node` | `?node=<uuid>` | Loads the dependency path to the given node on startup |
| `path` | `?path=<uuid>` | Loads the given learning path on startup |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| Escape | Close open modal |
| Space | Reset camera zoom to fit the entire graph |
| Arrow Left | Navigate back in graph history |
| Ctrl + Z | Navigate back in graph history |
| F1 | Open help modal |
