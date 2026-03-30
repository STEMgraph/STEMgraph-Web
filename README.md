# STEMgraph Web Visualizer

3D visualization of the STEMgraph learning graph.

## Features

- Interactive 3D force graph visualization of all learning resources
- Node details with topic, keywords, and dependencies
- Subgraph exploration for individual exercises
- Keyword search and keyword graph
- Load learning paths via UUID or URL

### Identity-based Features (Keycloak)

**Student**
- Mark lessons as completed or add them to a personal to-do list (persisted server-side)
- To-do graph: a subgraph of all marked to-do nodes
- My Progress: personal statistics with progress bar

**Teacher**
- All student features
- Create, edit, reorder, and delete learning paths
- Share learning paths via UUID or URL
- Analytics dashboard with Chart.js (active users, top lessons, event distribution)

**Admin**
- All teacher features
- Visibility of all learning paths (not just own)


## Technology

- **Frontend**: Vanilla JS
- **Visualization**: [3d-force-graph](https://github.com/vasturiano/3d-force-graph)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **API**: FastAPI (STEMgraph-API)
- **Database**: MariaDB
- **Auth**: Keycloak


## Usage

- `?node=<uuid>` — directly load a node with its dependencies
- `?keyword=<keyword>` — directly load nodes by keyword
- `?path=<uuid>` — directly load a learning path


## Keyboard Shortcuts

| Key | Action |
|---|---|
| `←` | Go back one step |
| `Space` | Reset view |
| `Esc` | Close node details |
| `F1` | Open help |

## To-Do
- example learning paths
- UI tweaks


## Setup

### Prerequisites
- Docker & Docker Compose
- A running Keycloak instance with a `stemgraph` realm and roles (`student`, `teacher`, `admin`)
- A running STEMgraph-API backend
- A MariaDB instance (can be started via the included `docker-compose.yml`)

### Configuration

1. Copy `.env.example` to `.env` and set your MariaDB credentials
2. Configure API and Keycloak endpoints in `src/config.js`
3. Adjust `nginx.conf` to match your backend container names

### Run

```bash
docker compose up -d --build


