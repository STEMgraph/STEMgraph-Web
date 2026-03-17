# STEMgraph Web Visualizer

3D visualization of the STEMgraph learning graph.

## Features

- **3D Force Graph** - Interactive 3D visualization of all learning resources
- **ToDo Graph** - A subgraph including all your marked To-Do nodes
- **Keyword Search** - Find exercises by keywords
- **Keyword Graph** - Visualize all available keywords as a graph
- **Node Details** - Click on nodes for details (topic, keywords, dependencies)
- **Subgraph Exploration** - Load relevant subgraphs for individual exercises
- **Progress Tracking** - Mark lessons as completed or add them to your To-Do list (persisted per user)
- **Learning Paths** - Learning Paths can be created, Teaches can add nodes to their paths, rearange them and share them via uuid or url, students can open learning paths, explore them and add them to their to-do list
- **Statistics** - Including all nodes/keywords and individually marked nodes
- **Authentication** - Login via Keycloak with role-based access (student / teacher / admin)

## Technology

- **Frontend**: Vanilla JS
- **Visualization**: [3d-force-graph](https://github.com/vasturiano/3d-force-graph)
- **API**: FastAPI (STEMgraph-API)
- **Database**: MariaDB
- **Auth**: Keycloak

## Usage

Have fun discovering the STEMgraph, a cloud of all keywords or search for a certain keyword.

- `?node=<uuid>` — directly load a node with its dependencies
- `?keyword=<keyword>` — directly load nodes by keyword

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `←` | Go back one step |
| `Space` | Reset view |
| `Esc` | Close node details |
| `F1` | Open help |

## To-Do
- features for admin role
- student statistics / something like a dashboard in the current ui
- Improved statistics (popular nodes, node visits)

## Setup

Configure API and Keycloak endpoints in `src/config.js`.

Copy `.env.example` to `.env` and set your credentials.

```bash
docker-compose up -d
```
