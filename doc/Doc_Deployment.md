# STEMgraph - Deployment Documentation

## Prerequisites

- Linux server with Docker and Docker Compose
- Nginx as a reverse proxy (external, outside the containers)
- A running Keycloak instance with a configured realm and client
- GitHub Personal Access Token (fine-grained, read-only access to public repositories)
- A publicly accessible domain for both the API and the frontend

---

## Step 1 - Create the Docker networks

If the external networks do not exist yet:

```bash
docker network create \
  --driver bridge \
  --subnet 172.20.20.0/24 \
  frontproxy_fnet

docker network create stemgraph-network
```

`frontproxy_fnet` is used by Nginx to reach the backend API and the frontend container. `stemgraph-network` connects the frontend container and the MariaDB container.

---

## Step 2 - Deploy the backend

### Clone the repository

```bash
git clone https://github.com/STEMgraph/STEMgraph-Web_Backend.git
cd STEMgraph-Web_Backend
```

### Configure environment variables

```bash
cp env-template .env
```

Fill in `.env`:

```
GITHUB_ORG=STEMgraph
DATABASE_DIR=/graph-db
STORAGE_DIR=/graph-db/repos
TEMPLATE_DIR=/graph-db/templates
PORT=8000

KEYCLOAK_URL=https://<keycloak-url>
REALM=stemgraph
CLIENT_ID=stemgraph-api
CLIENT_SECRET="<client-secret>"

MARIADB_HOST=<mariadb-host-or-container-name>
MARIADB_PORT=3306
MARIADB_USER=<db-user>
MARIADB_PASSWORD=<db-password>
MARIADB_NAME=stemgraph
```

### Store the GitHub PAT

```bash
mkdir -p secrets
echo "<github-personal-access-token>" > secrets/github.pat
```

The PAT requires read-only access to public repositories of the configured GitHub organization.

### Ensure `bin/main.py` points to the production version

```bash
cp bin/main.py.prod bin/main.py
```

### Start the container

```bash
docker compose -f docker-compose.yml.prod up -d --build
```

The container is then reachable internally at `172.20.20.30:8000`.

---

## Step 3 - Deploy the frontend

### Clone the repository

```bash
git clone https://github.com/STEMgraph/STEMgraph-Web.git
cd STEMgraph-Web
```

### Set the production URLs

In `src/config.js`:

```javascript
export const KEYCLOAK_BASE = 'https://<keycloak-url>/';
export const API_BASE = 'https://stemgraph-api.<domain>';

export const KEYCLOAK_CONFIG = {
    url: KEYCLOAK_BASE,
    realm: 'stemgraph',
    clientId: 'stemgraph-web'
};
```

### Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```
DB_ROOT_PASSWORD=<root-password>
DB_NAME=stemgraph
DB_USER=<db-user>
DB_PASSWORD=<db-password>
```

The values for `DB_USER` and `DB_PASSWORD` must match `MARIADB_USER` and `MARIADB_PASSWORD` in the backend `.env`.

### Start the containers

```bash
docker compose up -d --build
```

This starts both the frontend container and the MariaDB container. On first start, `mariadb-init.sql` is applied automatically - no manual schema setup required. The frontend is served as static files via Nginx.

---

## Step 4 - Configure Nginx (reverse proxy)

The external Nginx forwards incoming requests to the respective containers and handles TLS termination.

**Example configuration for the API:**

```nginx
server {
    listen 80;
    server_name stemgraph-api.<domain>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name stemgraph-api.<domain>;

    ssl_certificate     /etc/ssl/certs/<cert>.pem;
    ssl_certificate_key /etc/ssl/private/<key>.pem;

    location / {
        proxy_pass http://172.20.20.30:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Example configuration for the frontend:**

```nginx
server {
    listen 80;
    server_name stemgraph.<domain>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name stemgraph.<domain>;

    ssl_certificate     /etc/ssl/certs/<cert>.pem;
    ssl_certificate_key /etc/ssl/private/<key>.pem;

    location / {
        proxy_pass http://172.18.18.31:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Step 5 - Configure Keycloak

The following must be configured in the Keycloak realm `stemgraph`:

**Realm:**
- Name: `stemgraph`

**Client for the frontend:**
- Client ID: `stemgraph-web`
- Access type: `public`
- Valid redirect URIs: `https://stemgraph.<domain>/*`
- Web origins: `https://stemgraph.<domain>`

**Client for the API:**
- Client ID: `stemgraph-api`
- Access type: `confidential`
- Client secret: must match the value in `.env`

**Realm roles to create:**
- `student`
- `teacher`
- `admin`

Users receive their roles via realm role assignment in Keycloak.

---

## Step 6 - Initialize the database

After the first backend start, trigger the GitHub parser once:

```bash
curl -X POST https://stemgraph-api.<domain>/refreshDatabase
```

The parser runs as a background task. Progress can be followed in the container logs:

```bash
docker logs -f <container-name>
```

Once complete, the graph is available via `GET /getWholeGraph`.

---

## Applying Updates

### Update the backend

```bash
cd STEMgraph-Web_Backend
git pull
docker compose -f docker-compose.yml.prod up -d --build
```

### Update the frontend

```bash
cd STEMgraph-Web
git pull
docker compose up -d --build
```

---

## Volumes and Data Persistence

| Volume | Contents |
|---|---|
| `graph-db` | JSON-LD database, parsed repository metadata, templates |
| `db-data` (MariaDB) | User data, learning paths, events |

Volumes persist across container restarts. A full teardown with `docker compose down -v` will permanently delete all data.

