const KEYCLOAK_BASE = 'https://KEYCLOAKURL/';
const API_BASE = 'https://stemgraph-api.boekelmann.net';

const keycloak = new Keycloak({
    url: KEYCLOAK_BASE,
    realm: 'stemgraph',
    clientId: 'stemgraph-web'
});

keycloak.init({
    onLoad: 'check-sso'
}).then(authenticated => {
    const loginBtn = document.getElementById('btn-login');
    const logoutBtn = document.getElementById('btn-logout');
    const userGreeting = document.getElementById('user-greeting');
    const usernameSpan = document.getElementById('username');
    
    if (authenticated) {
    keycloak.loadUserProfile().then(profile => {
        usernameSpan.textContent = profile.username || profile.email || 'User';
    }).catch(() => {
        usernameSpan.textContent = 'User';
    });
    
    /* rollen-hierarchie aus token + hierarchie, da sonst alle default rolle */
    const roles = keycloak.realmAccess?.roles || [];
    let userRole = 'user';
    if (roles.includes('admin')) userRole = 'admin';
    else if (roles.includes('teacher')) userRole = 'teacher';
    else if (roles.includes('student')) userRole = 'student';
    document.getElementById('user-role').textContent = userRole;


    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'block';
    userGreeting.style.display = 'block';
}
});

async function saveTodoNodes(nodes) {
    try {
        const response = await fetch(KEYCLOAK_BASE + '/realms/stemgraph/account', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + keycloak.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                attributes: {
                    ToDoNodes: nodes
                }
            })
        });
        
        console.log('Status:', response.status);
        console.log('Response:', await response.text());
    } catch (error) {
        console.error('Fehler:', error);
    }
}

let Graph;
let graphHistory = [];
let markedNodes = JSON.parse(localStorage.getItem('markedNodes') || '[]');
let todoNodes = JSON.parse(localStorage.getItem('todoNodes') || '[]');
let currentNode = null;
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

/* node-farbe helper */
function getNodeColor(node) {
  if (markedNodes.includes(node.id)) return "#75b3da"; 
  if (todoNodes.includes(node.id)) return "#fdc075";   
  return "#e2e1e1";
}

const NODE_COLORS = {
  start: "#4156cc",
  end: "#ff6600",
  normal: "#888888",
  completed: "#4ad94a",
  todo: "#cfd94a"
};

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
    opacity: 0.85
  });

  const size = node.val ? Math.cbrt(node.val) * 2 : 5;

  let geometry;

  if (node.isKeyword) {
    geometry = new THREE.SphereGeometry(size, 16, 16);
  }
  else if (startNodeIds.has(node.id)) {
    geometry = new THREE.ConeGeometry(5, 10, 8);
  }
  else if (endNodeIds.has(node.id)) {
    geometry = new THREE.BoxGeometry(8, 8, 8);
  }
  else {
    geometry = new THREE.SphereGeometry(5, 16, 16);
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

/* dom-zuweisung für event handler */
const modal = document.getElementById('node-modal');
const statisticsModal = document.getElementById('statistics-modal');
const helpModal = document.getElementById('help-modal');
const modalTitle = document.getElementById('modal-title');
const modalId = document.getElementById('modal-id');
const modalKeywords = document.getElementById('modal-keywords');
const btnExplore = document.getElementById('btn-explore');
const btnGithub = document.getElementById('btn-github');
const btnMarkNode = document.getElementById('btn-marknode');
const btnTodoNode = document.getElementById('btn-todonode');
const btnBack = document.getElementById('btn-back');
const searchForm = document.getElementById('search-form');
const keywordInput = document.getElementById('keywordsearch');
const resetLink = document.getElementById('reset-graph');
const btnShowKeywords = document.getElementById('btn-show-keywords');
const btnShowKeywordCloud = document.getElementById('btn-show-keywordcloud');
const btnShowTodo = document.getElementById('btn-show-todo');
const btnShowStatistics = document.getElementById('btn-show-statistics');
const btnShowHelp = document.getElementById('btn-show-help');
const btnZoomReset = document.getElementById('btn-zoom-reset');

/* mobile navigation */
const hamburgerBtn = document.getElementById('hamburger-btn');
const menu = document.getElementById('menu');
const bottomHome = document.getElementById('bottom-home');
const bottomTodo = document.getElementById('bottom-todo');
const bottomStats = document.getElementById('bottom-stats');
const bottomHelp = document.getElementById('bottom-help');

/* history funktionen */
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

/* node-modal */
function openModal(node) {
  currentNode = node;
  modalTitle.textContent = node.teaches || 'Kein Topic';
  modalId.textContent = node.id;

  modalKeywords.innerHTML = '';
  if (node.keywords && node.keywords.length > 0) {
    node.keywords.forEach(keyword => {
      const span = document.createElement('span');
      span.textContent = keyword;
      modalKeywords.appendChild(span);
    });
  } else {
    modalKeywords.textContent = 'Keine Keywords';
  }

  if (markedNodes.includes(node.id)) {
    btnMarkNode.textContent = "Mark lesson as not completed";
  } else {
    btnMarkNode.textContent = "Mark lesson as completed";
  }

  if (todoNodes.includes(node.id)) {
    btnTodoNode.textContent = "Remove lesson from to-do list";
  } else {
    btnTodoNode.textContent = "Put lesson on your To-Do list";
  }

  modal.classList.remove('hidden');
}

function openStatisticsModal() {
  document.getElementById('stat-marked-count').textContent = markedNodes.length;
  document.getElementById('stat-todo-count').textContent = todoNodes.length;
  
  fetch(`${API_BASE}/getStatistics`)
    .then(r => r.json())
    .then(data => {
      document.getElementById('stat-node-count').textContent = data.nodeCount || 0;
      document.getElementById('stat-keyword-count').textContent = data.keywordCountDistinct || 0;
    });
  
  statisticsModal.classList.remove('hidden');
}

function openHelpModal() {
  helpModal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  statisticsModal.classList.add('hidden');
  helpModal.classList.add('hidden');
  currentNode = null;
}

/* event listener modal-buttons */
document.querySelectorAll('.btn-close').forEach(btn => {
  btn.addEventListener('click', closeModal);
});

document.getElementById('btn-login').addEventListener('click', () => {
    keycloak.login({
        redirectUri: 'https://stemgraph.boekelmann.net/'
    });
});

document.getElementById('btn-logout').addEventListener('click', () => {
    keycloak.logout();
});

btnBack.addEventListener('click', e => {
  e.preventDefault();
  goBack();
});

btnShowStatistics.addEventListener('click', e => {
  e.preventDefault();
  openStatisticsModal();
});

btnShowHelp.addEventListener('click', e => {
  e.preventDefault();
  openHelpModal();
});

/* node markieren  */
btnMarkNode.addEventListener('click', () => {
  if (!currentNode) return;

  if (markedNodes.includes(currentNode.id)) {
    markedNodes = markedNodes.filter(id => id !== currentNode.id);
    btnMarkNode.textContent = "Mark lesson as completed";
  } else {
    markedNodes.push(currentNode.id);
    btnMarkNode.textContent = "Mark lesson as not completed";
  }

  localStorage.setItem('markedNodes', JSON.stringify(markedNodes));
  Graph.nodeColor(Graph.nodeColor());
});

/* node todo */
btnTodoNode.addEventListener('click', () => {
  if (!currentNode) return;

  if (todoNodes.includes(currentNode.id)) {
    todoNodes = todoNodes.filter(id => id !== currentNode.id);
    btnTodoNode.textContent = "Put lesson on your To-Do list";
  } else {
    todoNodes.push(currentNode.id);
    btnTodoNode.textContent = "Remove lesson from to-do list";
  }

  localStorage.setItem('todoNodes', JSON.stringify(todoNodes));
  Graph.nodeColor(Graph.nodeColor());
});

/* subgraph */
btnExplore.addEventListener('click', () => {
  if (!currentNode) return;

  Graph.nodeAutoColorBy(null);
  const apiUrl = `${API_BASE}/getPathToExercise/${currentNode.id}`;
  loadGraph(apiUrl, true);
  closeModal();
});

/* link zur lesson */
btnGithub.addEventListener('click', () => {
  if (currentNode && currentNode.id) {
    const repoUrl = "https://github.com/STEMgraph/" + currentNode.id;
    window.open(repoUrl, "_blank");
    closeModal();
  }
});

/* keyword-suche */
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  const keyword = keywordInput.value.trim();
  if (keyword) {
    Graph.nodeAutoColorBy(null);
    loadGraph(`${API_BASE}/getExercisesByKeyword/${encodeURIComponent(keyword)}`);
  }
});

/* keyword liste anzeigen */
btnShowKeywords.addEventListener('click', e => {
  e.preventDefault();
  if (!Graph) return;

  const apiUrl = `${API_BASE}/getKeywordList`;

  fetch(apiUrl)
    .then(r => r.json())
    .then(data => {
      const keywords = data.keywords || [];
      
      const nodes = keywords.map(keyword => ({
        id: keyword,
        name: keyword,
        color: getRandomColor(),
        isKeyword: true
      }));

      const graphData = { nodes, links: [] };

      Graph.nodeAutoColorBy(null);
      Graph.nodeColor(node => node.color || getNodeColor(node));
      Graph.nodeVal(() => 1);
      Graph.graphData(graphData);

      setTimeout(() => Graph.zoomToFit(400, 80), 100);
      pushHistory(apiUrl);
    });
});

/* keyword cloud */
btnShowKeywordCloud.addEventListener('click', (e) => {
  e.preventDefault();
  if (!Graph) return;

  const apiUrl = `${API_BASE}/getKeywordCount`;

  fetch(apiUrl)
    .then(r => r.json())
    .then(data => {
      const keywordCounts = data.keywords || {};

      const nodes = Object.entries(keywordCounts).map(([keyword, count]) => ({
        id: keyword,
        name: keyword,
        val: Math.pow(count, 3),
        color: getRandomColor(),
        isKeyword: true
      }));

      const graphData = { nodes, links: [] };

      Graph.nodeAutoColorBy(null);
      Graph.nodeThreeObject(null);
      Graph.graphData(graphData);
      Graph.nodeThreeObject(createNodeThreeObject);

      setTimeout(() => Graph.zoomToFit(400, 80), 100);
      pushHistory(apiUrl);
    });
});

/* shared to-do graph loading function */
async function loadTodoGraph() {
  if (!Graph || todoNodes.length === 0) {
    alert('Keine To-Do Lessons vorhanden!');
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

    setTimeout(() => Graph.zoomToFit(400, 80), 100);
  } catch (error) {
    console.error('Fehler beim Laden des To-Do Graphs:', error);
    alert('Fehler beim Laden des To-Do Graphs');
  }
}

/* to-do graph - menu button */
btnShowTodo.addEventListener('click', async (e) => {
  e.preventDefault();
  await loadTodoGraph();
});

/* zoom reset */
btnZoomReset.addEventListener('click', e => {
  e.preventDefault();
  if (!Graph) return;
  Graph.zoomToFit(400, 80);
});

/* hamburger menu toggle */
hamburgerBtn.addEventListener('click', () => {
  menu.classList.toggle('open');
  hamburgerBtn.classList.toggle('active');
});

/* close menu when clicking outside */
document.addEventListener('click', e => {
  if (!menu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
    menu.classList.remove('open');
    hamburgerBtn.classList.remove('active');
  }
});

/* bottom bar navigation */
bottomHome.addEventListener('click', e => {
  e.preventDefault();
  window.location.href = '/';
});

bottomTodo.addEventListener('click', async e => {
  e.preventDefault();
  menu.classList.remove('open');
  hamburgerBtn.classList.remove('active');
  await loadTodoGraph();
});

bottomStats.addEventListener('click', e => {
  e.preventDefault();
  menu.classList.remove('open');
  hamburgerBtn.classList.remove('active');
  openStatisticsModal();
});

bottomHelp.addEventListener('click', e => {
  e.preventDefault();
  menu.classList.remove('open');
  hamburgerBtn.classList.remove('active');
  openHelpModal();
});

/* loadGraph funktion */
function loadGraph(url, addToHistory = true) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        if (response.status === 404) {
          alert("Keine Ergebnisse gefunden. Bitte überprüfe deine Suchanfrage.");
        } else {
          alert("Fehler beim Laden der Daten von der API.");
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
        Graph.zoomToFit(400, 80);
      }, 100);

      if (addToHistory) pushHistory(url);
    })
    .catch(error => {
      console.error("Fehler beim Laden:", error);
    });
}

/* initialer load */
const initialUrl = `${API_BASE}/getWholeGraph`;

initHistory();

loadStartEndNodes().then(() => {
  fetch(initialUrl)
    .then(r => r.json())
    .then(data => {
      data = sanitizeGraphData(data);
      
      Graph = ForceGraph3D()(document.getElementById("graph-container"))
        .graphData(data)
        .nodeLabel(node => node.teaches || node.name)
        .nodeThreeObject(createNodeThreeObject)
        .linkDirectionalParticles(3)
        .linkDirectionalParticleWidth(4)
        .linkDirectionalParticleSpeed(0.006)
        .onNodeClick(node => {
          if (node.isKeyword) {
            Graph.nodeAutoColorBy(null);
            loadGraph(`${API_BASE}/getExercisesByKeyword/${encodeURIComponent(node.name)}`);
          } else {
            openModal(node);
          }
        });

      pushHistory(initialUrl);
      setTimeout(() => Graph.zoomToFit(400, 80), 200);
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

/* keyboard bindings */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!modal.classList.contains('hidden') || 
        !statisticsModal.classList.contains('hidden') || 
        !helpModal.classList.contains('hidden')) {
      closeModal();
    }
  }

  if (e.key === ' ' || e.code === 'Space') {
    if (document.activeElement.tagName !== 'INPUT' && Graph) {
      e.preventDefault();
      Graph.zoomToFit(400, 80);
    }
  }

 if (e.key === 'ArrowLeft' || (e.key === 'z' && e.ctrlKey)) {
  if (document.activeElement.tagName !== 'INPUT' && graphHistory.length > 1) {
    e.preventDefault();
    goBack();
  }
  }

  if (e.key === 'F1') {
    e.preventDefault();
    openHelpModal();
  }
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
