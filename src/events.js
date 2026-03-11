import { API_BASE, GRAPH_CONFIG, DELAYS, KEYBINDINGS } from './config.js';
import { keycloak } from './auth.js';

/* dom-assignment */
const modal = document.getElementById('node-modal');
const statisticsModal = document.getElementById('statistics-modal');
const helpModal = document.getElementById('help-modal');
const modalTitle = document.getElementById('modal-title');
const modalId = document.getElementById('modal-id');
const modalKeywords = document.getElementById('modal-keywords');
const btnExplore = document.getElementById('btn-explore');
const btnGithub = document.getElementById('btn-github');
const btnMarkFinished = document.getElementById('btn-mark-finished');
const btnMarkTodo = document.getElementById('btn-mark-todo');
export const btnBack = document.getElementById('btn-back');
const searchForm = document.getElementById('search-form');
const keywordInput = document.getElementById('keywordsearch');
const btnWholeGraph = document.getElementById('btn-whole-graph');
const btnShowKeywordCloud = document.getElementById('btn-show-keywordcloud');
const btnShowTodo = document.getElementById('btn-show-todo');
const btnShowStatistics = document.getElementById('btn-show-statistics');
const btnShowHelp = document.getElementById('btn-show-help');
const btnZoomReset = document.getElementById('btn-zoom-reset');

/* menu toggle */
const menuToggle = document.getElementById('menu-toggle');
const menu = document.getElementById('menu');

/* modal functions */
let currentNode = null;

export function openModal(node, finishedNodes, todoNodes) {
  currentNode = node;
  modalTitle.textContent = node.teaches || 'No Topic';
  modalId.textContent = node.id;

  modalKeywords.innerHTML = '';
  if (node.keywords && node.keywords.length > 0) {
    node.keywords.forEach(keyword => {
      const span = document.createElement('span');
      span.textContent = keyword;
      modalKeywords.appendChild(span);
    });
  } else {
    modalKeywords.textContent = 'No Keywords';
  }

  if (finishedNodes.includes(node.id)) {
    btnMarkFinished.textContent = "Mark lesson as not completed";
  } else {
    btnMarkFinished.textContent = "Mark lesson as completed";
  }

  if (todoNodes.includes(node.id)) {
    btnMarkTodo.textContent = "Remove lesson from to-do list";
  } else {
    btnMarkTodo.textContent = "Put lesson on your To-Do list";
  }

  modal.classList.remove('hidden');
}

export function openStatisticsModal(finishedNodes, todoNodes) {
  document.getElementById('stat-finished-count').textContent = finishedNodes.length;
  document.getElementById('stat-todo-count').textContent = todoNodes.length;

  fetch(`${API_BASE}/getStatistics`)
    .then(r => r.json())
    .then(data => {
      document.getElementById('stat-node-count').textContent = data.nodeCount || 0;
      document.getElementById('stat-keyword-count').textContent = data.keywordCountDistinct || 0;
    });

  statisticsModal.classList.remove('hidden');
}

export function openHelpModal() {
  helpModal.classList.remove('hidden');
}

export function closeModal() {
  [modal, statisticsModal, helpModal].forEach(m => m.classList.add('hidden'));
  currentNode = null;
}

export function getCurrentNode() {
  return currentNode;
}

export function setupEventHandlers(callbacks) {
    const {
        Graph,
        finishedNodes,
        todoNodes,
        setFinishedNodes,
        setTodoNodes,
        goBack,
        loadGraph,
        loadTodoGraph,
        getRandomColor,
        createNodeThreeObject,
        pushHistory
    } = callbacks;

    /* event listener modal-buttons */
    document.querySelectorAll('.btn-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    /* auth handlers */
    document.getElementById('btn-login').addEventListener('click', () => {
        keycloak.login({
            redirectUri: window.location.origin + '/'
        });
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        keycloak.logout();
    });

    btnBack.addEventListener('click', e => {
        e.preventDefault();
        goBack();
    });

    /* whole graph */
    btnWholeGraph.addEventListener('click', e => {
        e.preventDefault();
        loadGraph(`${API_BASE}/getWholeGraph`);
    });

    btnShowStatistics.addEventListener('click', e => {
        e.preventDefault();
        openStatisticsModal(finishedNodes(), todoNodes());
    });

    btnShowHelp.addEventListener('click', e => {
        e.preventDefault();
        openHelpModal();
    });

    /* mark node */
    btnMarkFinished.addEventListener('click', () => {
        const node = getCurrentNode();
        if (!node) return;

        const userId = keycloak.tokenParsed?.sub;
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}` };

        let updatedFinished;
        if (finishedNodes().includes(node.id)) {
            updatedFinished = finishedNodes().filter(id => id !== node.id);
            btnMarkFinished.textContent = "Mark lesson as completed";
            fetch(`${API_BASE}/users/${userId}/finished/${node.id}`, { method: 'DELETE', headers });
        } else {
            updatedFinished = [...finishedNodes(), node.id];
            btnMarkFinished.textContent = "Mark lesson as not completed";
            fetch(`${API_BASE}/users/${userId}/finished`, { method: 'POST', headers, body: JSON.stringify({ node_id: node.id }) });
        }

        setFinishedNodes(updatedFinished);
        Graph().nodeThreeObject(Graph().nodeThreeObject());
    });

    /* node todo */
    btnMarkTodo.addEventListener('click', () => {
        const node = getCurrentNode();
        if (!node) return;

        const userId = keycloak.tokenParsed?.sub;
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}` };

        let updatedTodo;
        if (todoNodes().includes(node.id)) {
            updatedTodo = todoNodes().filter(id => id !== node.id);
            btnMarkTodo.textContent = "Put lesson on your To-Do list";
            fetch(`${API_BASE}/users/${userId}/todo/${node.id}`, { method: 'DELETE', headers });
        } else {
            updatedTodo = [...todoNodes(), node.id];
            btnMarkTodo.textContent = "Remove lesson from to-do list";
            fetch(`${API_BASE}/users/${userId}/todo`, { method: 'POST', headers, body: JSON.stringify({ node_id: node.id }) });
        }

        setTodoNodes(updatedTodo);
        Graph().nodeThreeObject(Graph().nodeThreeObject());
    });

    /* subgraph */
    btnExplore.addEventListener('click', () => {
        const node = getCurrentNode();
        if (!node) return;

        Graph().nodeAutoColorBy(null);
        const apiUrl = `${API_BASE}/getPathToExercise/${node.id}`;
        loadGraph(apiUrl, true);
        closeModal();
    });

    /* lesson link */
    btnGithub.addEventListener('click', () => {
        const node = getCurrentNode();
        if (node && node.id) {
            const repoUrl = "https://github.com/STEMgraph/" + node.id;
            window.open(repoUrl, "_blank");
            closeModal();
        }
    });

    /* keyword search */
    searchForm.addEventListener('submit', e => {
        e.preventDefault();
        const keyword = keywordInput.value.trim();
        if (keyword) {
            Graph().nodeAutoColorBy(null);
            loadGraph(`${API_BASE}/getExercisesByKeyword/${encodeURIComponent(keyword)}`);
        }
    });

    /* keyword cloud */
    btnShowKeywordCloud.addEventListener('click', (e) => {
        e.preventDefault();
        if (!Graph()) return;

        const apiUrl = `${API_BASE}/getKeywordCount`;

        fetch(apiUrl)
            .then(r => r.json())
            .then(data => {
                const keywordCounts = data.keywords || {};

                const nodes = Object.entries(keywordCounts).map(([keyword, count]) => ({
                    id: keyword,
                    name: keyword,
                    val: count,
                    color: getRandomColor(),
                    isKeyword: true
                }));

                const graphData = { nodes, links: [] };

                Graph().nodeAutoColorBy(null);
                Graph().nodeThreeObject(null);
                Graph().graphData(graphData);
                Graph().nodeThreeObject(createNodeThreeObject);

                setTimeout(() => Graph().zoomToFit(GRAPH_CONFIG.zoomDuration, GRAPH_CONFIG.zoomPadding), DELAYS.zoomShort);
                pushHistory(apiUrl);
            });
    });

    /* to-do graph - menu button */
    btnShowTodo.addEventListener('click', async (e) => {
        e.preventDefault();
        await loadTodoGraph();
    });

    /* zoom reset */
    btnZoomReset.addEventListener('click', e => {
        e.preventDefault();
        if (!Graph()) return;
        Graph().zoomToFit(GRAPH_CONFIG.zoomDuration, GRAPH_CONFIG.zoomPadding);
    });

    /* menu toggle */
    menuToggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        menuToggle.classList.toggle('menu-open');
    });

    /* close menu when clicking outside */
    document.addEventListener('click', e => {
        if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
            menu.classList.remove('open');
            menuToggle.classList.remove('menu-open');
        }
    });


    /* keyboard bindings */
    document.addEventListener('keydown', e => {
        if (e.key === KEYBINDINGS.closeModal) {
            if (!modal.classList.contains('hidden') ||
                !statisticsModal.classList.contains('hidden') ||
                !helpModal.classList.contains('hidden')) {
                closeModal();
            }
        }

        if (e.key === KEYBINDINGS.zoomReset) {
            if (document.activeElement.tagName !== 'INPUT' && Graph()) {
                e.preventDefault();
                Graph().zoomToFit(GRAPH_CONFIG.zoomDuration, GRAPH_CONFIG.zoomPadding);
            }
        }

        if (e.key === KEYBINDINGS.goBack || (e.key === KEYBINDINGS.goBackAlt && e.ctrlKey)) {
            if (document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                goBack();
            }
        }

        if (e.key === KEYBINDINGS.help) {
            e.preventDefault();
            openHelpModal();
        }
    });
}
