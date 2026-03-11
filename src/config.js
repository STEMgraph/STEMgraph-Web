export const KEYCLOAK_BASE = 'https://KEYCLOAKURL/';
export const API_BASE = 'https://stemgraph-api.boekelmann.net';

export const KEYCLOAK_CONFIG = {
    url: KEYCLOAK_BASE,
    realm: 'stemgraph',
    clientId: 'stemgraph-web'
};

export const KEYCLOAK_INIT_OPTIONS = {
    onLoad: 'check-sso',
    checkLoginIframe: false
};


// graph stuff
export const NODE_COLORS = {
    start: "#4156cc",
    end: "#ff6600",
    normal: "#888888",
    finishedNode: "#75b3da",
    todoNode: "#fdc075",
    default: "#e2e1e1"
};

export const GRAPH_CONFIG = {
    linkDirectionalParticles: 3,
    linkDirectionalParticleWidth: 4,
    linkDirectionalParticleSpeed: 0.006,
    zoomDuration: 400,
    zoomPadding: 80,
    nodeOpacity: 0.85
};

export const NODE_SIZES = {
    sphere: 5,
    cone: {
        radius: 5,
        height: 10,
        segments: 8
    },
    box: 8,
    sphereSegments: 16,
    keywordSizeMultiplier: 4 
};

// animation delays (ms)
export const DELAYS = {
    zoomShort: 100,
    zoomLong: 200
};

// keyboard bindings
export const KEYBINDINGS = {
    closeModal: 'Escape',
    zoomReset: ' ', 
    goBack: 'ArrowLeft',
    goBackAlt: 'z',  // with ctrl
    help: 'F1'
};
