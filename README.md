# STEMgraph Web Visualizer

3D visualization of the STEMgraph learning graph.

## Features

- **3D Force Graph** - Interactive 3D visualization of all learning resources
- **ToDo Graph** - A Subgraph including all your marked To-Do Nodes
- **Keyword Search** - Find exercises by keywords
- **Keyword Graph** - Visualize all available keywords as a graph
- **Node Details** - Click on nodes for details (topic, keywords, dependencies)
- **Subgraph Exploration** - Load relevant subgraphs for individual exercises
- **Statistics** - including all nodes/keywords and individually marked nodes
- **Identity** - so far just login via Keycloak

## Technology

- **Frontend**: Vanilla JS
- **Visualization**: [3d-force-graph](https://github.com/vasturiano/3d-force-graph)
- **API**: FastAPI (STEMgraph-API)
- **Keycloak**: Keycloak Server

## Usage 
Have fun discovering the STEMgraph, a Cloud of all Keywords or search for a certain Keyword.
- Query Parameter to directly access nodes with their dependencies: index.html?node=uuid
- Query Parameter to directly access nodes with a certain keyword: index.html?keyword=keyword

## Keyboard-Bindings
- LEFTARROW to go one step back
- SPACE to reset the view automatically
- ESC to exit the node-details
- F1 to open the help modal

## To-Do
- persistent saving of marked nodes (so far just localstorage)
- more individual possibilities
- learning paths
- admin and user dashboard

## Setup

- clone this repo
- configure your API endpoints in `src/config.js`:

```javascript
export const API_BASE = 'https://your-api-url';
export const KEYCLOAK_BASE = 'https://your-keycloak-url/';
```

### Local Development

Start a local server:

```bash
python3 -m http.server 8999
```

Open `http://localhost:8999\` in your browser.

**Note:** For local development, please consider CORS configuration

### Docker Deployment

use docker-compose:

```bash
docker-compose up -d
```

### Production Deployment

Copy files to your web server directory (e.g., Nginx, Apache):

Configure your web server to serve the directory and restart. Update \`API_BASE\` in \`src/config.js\` to your production API endpoint.




