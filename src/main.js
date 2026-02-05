import {
    KEYCLOAK_BASE,
    API_BASE,
    NODE_COLORS,
    GRAPH_CONFIG,
    NODE_SIZES,
    DELAYS
} from './config.js';
import { keycloak, initAuth } from './auth.js';
import { setupEventHandlers, openModal, openStatisticsModal, openHelpModal, closeModal, getCurrentNode, btnBack } from './events.js';

initAuth();

let Graph;
let graphHistory = [];
let finishedNodes = JSON.parse(localStorage.getItem('finishedNodes') || '[]');
let todoNodes = JSON.parse(localStorage.getItem('todoNodes') || '[]');
let startNodeIds = new Set();
let endNodeIds = new Set();

async function loadStartEndNodes() {
  try {
    const [startRes, endRes] = await Promise.all([
      fetch(`${API_BASE}/getStartNodes`),
      fetch(`${API_BASE}/getEndNodes`)
    ]);
    const startData = await startRes.json();
    const endData = await endRes.json();

    startNodeIds.clear();
    endNodeIds.clear();

    (startData.nodes || []).forEach(node => startNodeIds.add(node.id));
    (endData.nodes || []).forEach(node => endNodeIds.add(node.id));
  } catch (e) {
    console.error("Error loading start/end nodes:", e);
  }
}

/* node-color helper */
function getNodeColor(node) {
  if (finishedNodes.includes(node.id)) return NODE_COLORS.finishedNode;
  if (todoNodes.includes(node.id)) return NODE_COLORS.todoNode;
  return NODE_COLORS.default;
}

function createNodeThreeObject(node) {
  let color;
  if (node.isKeyword) {
    color = node.color || NODE_COLORS.normal;
  } else if (startNodeIds.has(node.id)) {
    color = NODE_COLORS.start;
  } else if (endNodeIds.has(node.id)) {
    color = NODE_COLORS.end;
  } else {
    color = node.color || getNodeColor(node);
  }

  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: GRAPH_CONFIG.nodeOpacity
  });

  const size = node.val ? node.val * NODE_SIZES.keywordSizeMultiplier : NODE_SIZES.sphere;

  let geometry;

  if (node.isKeyword) {
    geometry = new THREE.SphereGeometry(size, NODE_SIZES.sphereSegments, NODE_SIZES.sphereSegments);
  }
  else if (startNodeIds.has(node.id)) {
    geometry = new THREE.ConeGeometry(NODE_SIZES.cone.radius, NODE_SIZES.cone.height, NODE_SIZES.cone.segments);
  }
  else if (endNodeIds.has(node.id)) {
    geometry = new THREE.BoxGeometry(NODE_SIZES.box, NODE_SIZES.box, NODE_SIZES.box);
  }
  else {
    geometry = new THREE.SphereGeometry(NODE_SIZES.sphere, NODE_SIZES.sphereSegments, NODE_SIZES.sphereSegments);
  }

  return new THREE.Mesh(geometry, material);
}

function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`;
}

/* !!!!!MISSING NODES FIX!!! */
function sanitizeGraphData(data) {
  const nodeIds = new Set(data.nodes.map(n => n.id));
  const missingNodes = new Set();
  
  data.links.forEach(link => {
    if (!nodeIds.has(link.source)) missingNodes.add(link.source);
    if (!nodeIds.has(link.target)) missingNodes.add(link.target);
  });
  
  missingNodes.forEach(id => {
    data.nodes.push({ id, name: id, teaches: 'Unknown' });
  });
  
  return data;
}

/* history functions */
function initHistory() {
  graphHistory = [];
  localStorage.removeItem('graphHistory');
  updateBackButton();
}

function updateBackButton() {
  if (graphHistory.length <= 1) {
    btnBack.classList.add('disabled');
  } else {
    btnBack.classList.remove('disabled');
  }
}

function pushHistory(apiUrl) {
  graphHistory.push(apiUrl);
  localStorage.setItem('graphHistory', JSON.stringify(graphHistory));
  updateBackButton();
}

function goBack() {
  if (graphHistory.length <= 1) return;
  graphHistory.pop();
  const previousUrl = graphHistory[graphHistory.length - 1];
  if (previousUrl) loadGraph(previousUrl, false);
  localStorage.setItem('graphHistory', JSON.stringify(graphHistory));
  updateBackButton();
}

/* shared to-do graph loading function */
async function loadTodoGraph() {
  if (!Graph || todoNodes.length === 0) {
    alert('No To-Do lessons available!');
    return;
  }

  try {
    const pathPromises = todoNodes.map(nodeId =>
      fetch(`${API_BASE}/getPathToExercise/${nodeId}`)
        .then(r => r.json())
    );

    const pathResults = await Promise.all(pathPromises);

    const allNodes = new Map();
    const allLinks = [];

    pathResults.forEach(data => {
      const sanitized = sanitizeGraphData(data);

      sanitized.nodes.forEach(node => {
        if (!allNodes.has(node.id)) {
          allNodes.set(node.id, node);
        }
      });

      sanitized.links.forEach(link => {
        const linkId = `${link.source}-${link.target}`;
        if (!allLinks.find(l => `${l.source}-${l.target}` === linkId)) {
          allLinks.push(link);
        }
      });
    });

    const combinedGraph = {
      nodes: Array.from(allNodes.values()),
      links: allLinks
    };

    Graph.nodeAutoColorBy(null);
    Graph.nodeColor(getNodeColor);
    Graph.nodeVal(() => 1);
    Graph.graphData(combinedGraph);

    setTimeout(() => Graph.zoomToFit(GRAPH_CONFIG.zoomDuration, GRAPH_CONFIG.zoomPadding), DELAYS.zoomShort);
  } catch (error) {
    console.error('Fehler beim Laden des To-Do Graphs:', error);
    alert('Fehler beim Laden des To-Do Graphs');
  }
}

/* loadGraph */
function loadGraph(url, addToHistory = true) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        if (response.status === 404) {
          alert("No results found. Please check your search query.");
        } else {
          alert("Error loading data from the API.");
        }
        return null;
      }
      return response.json();
    })
    .then(data => {
      if (!data) return;
      
      data = sanitizeGraphData(data);
      
      Graph.nodeAutoColorBy(null);
      Graph.nodeColor(getNodeColor);
      Graph.nodeVal(() => 1);
      Graph.graphData(data);

      setTimeout(() => {
        Graph.zoomToFit(GRAPH_CONFIG.zoomDuration, GRAPH_CONFIG.zoomPadding);
      }, DELAYS.zoomShort);

      if (addToHistory) pushHistory(url);
    })
    .catch(error => {
      console.error("Fehler beim Laden:", error);
    });
}

/* initial load */
const initialUrl = `${API_BASE}/getWholeGraph`;

initHistory();

loadStartEndNodes().then(() => {
  fetch(initialUrl)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      data = sanitizeGraphData(data);
      
      Graph = ForceGraph3D()(document.getElementById("graph-container"))
        .graphData(data)
        .nodeLabel(node => node.teaches || node.name)
        .nodeThreeObject(createNodeThreeObject)
        .linkDirectionalParticles(GRAPH_CONFIG.linkDirectionalParticles)
        .linkDirectionalParticleWidth(GRAPH_CONFIG.linkDirectionalParticleWidth)
        .linkDirectionalParticleSpeed(GRAPH_CONFIG.linkDirectionalParticleSpeed)
        .onNodeClick(node => {
          if (node.isKeyword) {
            Graph.nodeAutoColorBy(null);
            loadGraph(`${API_BASE}/getExercisesByKeyword/${encodeURIComponent(node.name)}`);
          } else {
            openModal(node, finishedNodes, todoNodes);
          }
        });

      pushHistory(initialUrl);
      setTimeout(() => Graph.zoomToFit(GRAPH_CONFIG.zoomDuration, GRAPH_CONFIG.zoomPadding), DELAYS.zoomLong);

      /* setup event handlers after graph is initialized */
      setupEventHandlers({
        Graph: () => Graph,
        finishedNodes: () => finishedNodes,
        todoNodes: () => todoNodes,
        setFinishedNodes: (nodes) => { finishedNodes = nodes; },
        setTodoNodes: (nodes) => { todoNodes = nodes; },
        goBack,
        loadGraph,
        loadTodoGraph,
        getRandomColor,
        createNodeThreeObject,
        pushHistory
      });
    })
    .catch(error => {
      console.error("Initial graph load failed:", error);
      document.getElementById("graph-container").innerHTML =
        '<p style="color:#fff;text-align:center;margin-top:40vh;">Nodes konnten nicht geladen werden.</p>';
    });
});

/* keyword autocomplete */
fetch(`${API_BASE}/getKeywordList`)
  .then(r => r.json())
  .then(data => {
    const datalist = document.getElementById('keyword-suggestions');
    (data.keywords || []).forEach(keyword => {
      const option = document.createElement('option');
      option.value = keyword;
      datalist.appendChild(option);
    });
  });

/* query params */
(function() {
  const params = new URLSearchParams(window.location.search);

  if (params.has('keyword')) {
    const kw = params.get('keyword').trim();
    if (kw) loadGraph(`${API_BASE}/getExercisesByKeyword/${encodeURIComponent(kw)}`);
    return;
  }

  if (params.has('node')) {
    const id = params.get('node').trim();
    if (id) loadGraph(`${API_BASE}/getPathToExercise/${encodeURIComponent(id)}`);
    return;
  }
})();