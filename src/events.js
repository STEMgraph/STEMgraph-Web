import { API_BASE, GRAPH_CONFIG, DELAYS, KEYBINDINGS } from './config.js';
import { keycloak } from './auth.js';

/* dom-assignment */
const modal = document.getElementById('node-modal');
const statisticsModal = document.getElementById('statistics-modal');
const helpModal = document.getElementById('help-modal');
const learningPathsModal = document.getElementById('learning-paths-modal');
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

function refreshPathSelect() {
  const roles = keycloak.realmAccess?.roles || [];
  if (!roles.includes('teacher') && !roles.includes('admin')) return;

  const select = document.getElementById('path-select');
  select.innerHTML = '<option value="">Select a path...</option>';

  const userId = keycloak.tokenParsed?.sub;
  const isAdmin = roles.includes('admin');

  fetch(`${API_BASE}/paths`)
    .then(r => r.json())
    .then(paths => {
      const myPaths = isAdmin ? paths : paths.filter(p => p.creator_id === userId);
      myPaths.forEach(path => {
        const option = document.createElement('option');
        option.value = path.id;
        option.textContent = path.name;
        select.appendChild(option);
      });
    });
}

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

  refreshPathSelect();
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

export function openLearningPathsModal() {
  const listView = document.getElementById('learning-paths-list-view');
  const editView = document.getElementById('learning-path-edit-view');
  listView.classList.remove('hidden');
  editView.classList.add('hidden');
  document.getElementById('path-lookup-section').classList.remove('hidden');

  /* reset lookup */
  document.getElementById('path-lookup-uuid').value = '';
  document.getElementById('path-lookup-result').classList.add('hidden');

  const list = document.getElementById('learning-paths-list');
  list.innerHTML = '<p style="color: rgba(255,255,255,0.5)">Loading...</p>';
  document.getElementById('learning-paths-modal-title').textContent = 'Learning Paths';
  learningPathsModal.classList.remove('hidden');

  fetch(`${API_BASE}/paths`)
    .then(r => r.json())
    .then(paths => {
      list.innerHTML = '';
      if (paths.length === 0) {
        list.innerHTML = '<p style="color: rgba(255,255,255,0.5)">No learning paths yet.</p>';
        return;
      }
      paths.forEach(path => {
        const item = document.createElement('div');
        item.className = 'path-list-item';
        item.dataset.id = path.id;
        item.innerHTML = `
          <span class="path-name">${path.name}</span>
          <div class="path-actions">
            <button class="btn-load-path">Load Graph</button>
            <button class="btn-edit-path">Edit</button>
            <button class="btn-delete-path">Delete</button>
          </div>
        `;
        list.appendChild(item);
      });
    })
    .catch(() => {
      list.innerHTML = '<p style="color: rgba(255,255,255,0.5)">Failed to load paths.</p>';
    });
}

function openPathEditView(pathId) {
  const listView = document.getElementById('learning-paths-list-view');
  const editView = document.getElementById('learning-path-edit-view');
  const lookupSection = document.getElementById('path-lookup-section');
  listView.classList.add('hidden');
  lookupSection.classList.add('hidden');
  editView.classList.remove('hidden');
  editView.dataset.pathId = pathId;

  const nodesContainer = document.getElementById('path-edit-nodes');
  nodesContainer.innerHTML = '<p style="color: rgba(255,255,255,0.5)">Loading...</p>';

  fetch(`${API_BASE}/paths/${pathId}`)
    .then(r => r.json())
    .then(async path => {
      document.getElementById('path-edit-name').value = path.name;
      document.getElementById('path-edit-id').textContent = pathId;
      document.getElementById('learning-paths-modal-title').textContent = `Edit: ${path.name}`;

      const nodeIds = path.nodes || [];
      if (nodeIds.length === 0) {
        nodesContainer.innerHTML = '<p style="color: rgba(255,255,255,0.5)">No nodes in this path.</p>';
        return;
      }

      const nodeResults = await Promise.all(
        nodeIds.map(nodeId => fetch(`${API_BASE}/getExercise/${nodeId}`).then(r => r.json()))
      );

      nodesContainer.innerHTML = '';
      nodeIds.forEach((nodeId, index) => {
        const nodeData = nodeResults[index];
        const nodeName = (nodeData.nodes && nodeData.nodes.length > 0)
          ? (nodeData.nodes[0].teaches || nodeData.nodes[0].name || nodeId)
          : nodeId;

        const item = document.createElement('div');
        item.className = 'path-node-item';
        item.dataset.nodeId = nodeId;
        item.innerHTML = `
          <div class="path-node-info">
            <span class="path-node-pos">${index + 1}.</span>
            <span class="path-node-name">${nodeName}</span>
          </div>
          <div class="path-node-actions">
            <button class="btn-node-up" ${index === 0 ? 'disabled' : ''}>&#9650;</button>
            <button class="btn-node-down" ${index === nodeIds.length - 1 ? 'disabled' : ''}>&#9660;</button>
            <button class="btn-node-remove">&#10005;</button>
          </div>
        `;
        nodesContainer.appendChild(item);
      });
    });
}

async function reorderPathNodes(pathId) {
  const items = document.querySelectorAll('#path-edit-nodes .path-node-item');
  const nodeIds = Array.from(items).map(item => item.dataset.nodeId);
  await fetch(`${API_BASE}/paths/${pathId}/nodes/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}` },
    body: JSON.stringify({ node_ids: nodeIds })
  });
}

export function closeModal() {
  [modal, statisticsModal, helpModal, learningPathsModal].forEach(m => m.classList.add('hidden'));
  document.getElementById('learning-paths-list-view').classList.remove('hidden');
  document.getElementById('learning-path-edit-view').classList.add('hidden');
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
        loadPathGraph,
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

    /* add to path */
    document.getElementById('btn-add-to-path').addEventListener('click', async () => {
        const node = getCurrentNode();
        if (!node) return;

        const pathId = document.getElementById('path-select').value;
        if (!pathId) return;

        const includeDeps = document.getElementById('add-dependencies-checkbox').checked;
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}` };
        const btn = document.getElementById('btn-add-to-path');

        try {
            if (includeDeps) {
                const data = await fetch(`${API_BASE}/getPathToExercise/${node.id}`).then(r => r.json());
                await Promise.all(data.nodes.map(n =>
                    fetch(`${API_BASE}/paths/${pathId}/nodes`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ node_id: n.id })
                    })
                ));
            } else {
                await fetch(`${API_BASE}/paths/${pathId}/nodes`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ node_id: node.id })
                });
            }
            btn.textContent = 'Added!';
            setTimeout(() => { btn.textContent = 'Add to Path'; }, 1500);
        } catch {
            btn.textContent = 'Error';
            setTimeout(() => { btn.textContent = 'Add to Path'; }, 1500);
        }
    });

    /* learning paths */
    document.getElementById('btn-show-learning-paths').addEventListener('click', e => {
        e.preventDefault();
        openLearningPathsModal();
    });

    document.getElementById('btn-create-path').addEventListener('click', () => {
        const nameInput = document.getElementById('new-path-name');
        const name = nameInput.value.trim();
        if (!name) return;

        fetch(`${API_BASE}/paths`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}` },
            body: JSON.stringify({ name })
        })
            .then(r => r.json())
            .then(() => {
                nameInput.value = '';
                openLearningPathsModal();
            });
    });

    document.getElementById('learning-paths-list').addEventListener('click', e => {
        const item = e.target.closest('.path-list-item');
        if (!item) return;
        const pathId = item.dataset.id;

        if (e.target.classList.contains('btn-load-path')) {
            loadPathGraph(pathId);
            closeModal();
        }

        if (e.target.classList.contains('btn-edit-path')) {
            openPathEditView(pathId);
        }

        if (e.target.classList.contains('btn-delete-path')) {
            fetch(`${API_BASE}/paths/${pathId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${keycloak.token}` }
            }).then(() => openLearningPathsModal());
        }
    });

    /* path lookup by UUID */
    document.getElementById('btn-path-lookup').addEventListener('click', () => {
        const uuid = document.getElementById('path-lookup-uuid').value.trim();
        if (!uuid) return;
        const result = document.getElementById('path-lookup-result');
        result.innerHTML = '<p style="color: rgba(255,255,255,0.5)">Loading...</p>';
        result.classList.remove('hidden');

        fetch(`${API_BASE}/paths/${uuid}`)
            .then(r => {
                if (!r.ok) throw new Error('Not found');
                return r.json();
            })
            .then(path => {
                const isAuth = keycloak.authenticated;
                result.innerHTML = `
                    <div class="path-lookup-item">
                        <span class="path-lookup-name">${path.name}</span>
                        <div class="path-lookup-actions">
                            <button class="btn-lookup-load">Load Graph</button>
                            ${isAuth ? '<button class="btn-lookup-add-todo">Add to Todo</button>' : ''}
                        </div>
                    </div>
                `;
                result.dataset.pathId = uuid;
            })
            .catch(() => {
                result.innerHTML = '<p style="color: rgba(255,255,255,0.5)">Path not found.</p>';
            });
    });

    /* lookup result actions */
    document.getElementById('path-lookup-result').addEventListener('click', async (e) => {
        const pathId = document.getElementById('path-lookup-result').dataset.pathId;
        if (!pathId) return;

        if (e.target.classList.contains('btn-lookup-load')) {
            loadPathGraph(pathId);
            closeModal();
        }

        if (e.target.classList.contains('btn-lookup-add-todo')) {
            const userId = keycloak.tokenParsed?.sub;
            const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}` };
            try {
                const pathRes = await fetch(`${API_BASE}/paths/${pathId}`);
                const path = await pathRes.json();
                const nodeIds = path.nodes || [];
                await Promise.all(nodeIds.map(nodeId =>
                    fetch(`${API_BASE}/users/${userId}/todo`, {
                        method: 'POST', headers,
                        body: JSON.stringify({ node_id: nodeId })
                    })
                ));
                /* update local todoNodes so Todo Graph works without reload */
                const currentTodos = todoNodes();
                const newTodos = [...currentTodos, ...nodeIds.filter(id => !currentTodos.includes(id))];
                setTodoNodes(newTodos);
                e.target.textContent = 'Added!';
                setTimeout(() => { e.target.textContent = 'Add to Todo'; }, 1500);
            } catch {
                e.target.textContent = 'Error';
                setTimeout(() => { e.target.textContent = 'Add to Todo'; }, 1500);
            }
        }
    });

    /* path edit view - back button */
    document.getElementById('btn-path-edit-back').addEventListener('click', () => {
        openLearningPathsModal();
    });

    /* path edit view - rename */
    document.getElementById('btn-path-rename').addEventListener('click', () => {
        const pathId = document.getElementById('learning-path-edit-view').dataset.pathId;
        const newName = document.getElementById('path-edit-name').value.trim();
        if (!newName) return;
        fetch(`${API_BASE}/paths/${pathId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}` },
            body: JSON.stringify({ name: newName })
        }).then(() => {
            const btn = document.getElementById('btn-path-rename');
            btn.textContent = 'Saved!';
            setTimeout(() => { btn.textContent = 'Rename'; }, 1500);
        });
    });

    /* path edit view - copy UUID */
    document.getElementById('btn-copy-path-id').addEventListener('click', () => {
        const uuid = document.getElementById('path-edit-id').textContent;
        navigator.clipboard.writeText(uuid);
        const btn = document.getElementById('btn-copy-path-id');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy UUID'; }, 1500);
    });

    /* path edit view - copy URL */
    document.getElementById('btn-copy-path-url').addEventListener('click', () => {
        const uuid = document.getElementById('path-edit-id').textContent;
        const url = `${window.location.origin}${window.location.pathname}?path=${uuid}`;
        navigator.clipboard.writeText(url);
        const btn = document.getElementById('btn-copy-path-url');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy URL'; }, 1500);
    });

    /* path edit view - node actions (up, down, remove) */
    document.getElementById('path-edit-nodes').addEventListener('click', async (e) => {
        const item = e.target.closest('.path-node-item');
        if (!item) return;
        const pathId = document.getElementById('learning-path-edit-view').dataset.pathId;

        if (e.target.classList.contains('btn-node-remove')) {
            const nodeId = item.dataset.nodeId;
            await fetch(`${API_BASE}/paths/${pathId}/nodes/${nodeId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            openPathEditView(pathId);
        }

        if (e.target.classList.contains('btn-node-up')) {
            const prev = item.previousElementSibling;
            if (prev) {
                item.parentNode.insertBefore(item, prev);
                await reorderPathNodes(pathId);
                openPathEditView(pathId);
            }
        }

        if (e.target.classList.contains('btn-node-down')) {
            const next = item.nextElementSibling;
            if (next) {
                item.parentNode.insertBefore(next, item);
                await reorderPathNodes(pathId);
                openPathEditView(pathId);
            }
        }
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
                !helpModal.classList.contains('hidden') ||
                !learningPathsModal.classList.contains('hidden')) {
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
