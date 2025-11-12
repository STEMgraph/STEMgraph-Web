# STEMgraph Web Visualizer

3D visualization of the STEMgraph learning graph.

## Features

- **3D Force Graph** - Interactive 3D visualization of all learning resources
- **Keyword Search** - Find exercises by keywords
- **Keyword Graph** - Visualize all available keywords as a graph
- **Node Details** - Click on nodes for details (topic, keywords, dependencies)
- **Subgraph Exploration** - Load relevant subgraphs for individual exercises

## Technology

- **Frontend**: Vanilla JavaScript
- **Visualization**: [3d-force-graph](https://github.com/vasturiano/3d-force-graph)
- **API**: FastAPI (STEMgraph-API)

## API Endpoints

```
GET /getWholeGraph          - Complete graph
GET /getKeywords            - All keywords
GET /getExercisesByKeyword/{keyword}  - Exercises by keyword
GET /getPathToExercise/{id} - Subgraph for exercise
```
