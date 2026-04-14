# STEMgraph - Guide for Admins

## Role "admin"

The **admin** role includes all features of the **teacher** role plus platform administration tools. This guide covers only the extended features. For learning path management and general platform usage see `Doc_Teacher.md`.

---

## Analytics Dashboard

The analytics dashboard gives an overview of platform usage. It is accessible via the **Analytics** button in the menu (visible to admins only).

### Sections

**Active Users**

Shows the total number of registered users who have interacted with the platform, as well as the number of active users in the last 7 and 30 days.

**Top Opened Lessons**

A bar chart of the lessons most frequently opened via the GitHub link. Reflects which content users are actually accessing.

**Top Completed Lessons**

A bar chart of the lessons most frequently marked as completed across all users.

**Top Loaded Paths**

A bar chart of the learning paths most frequently loaded. Useful for identifying which teacher-created paths are actively used.

**Event Type Overview**

A chart showing the distribution of all tracked event types (`link_open`, `finished`, `todo_add`, `todo_remove`, `path_load`).

---

## Refresh Graph Data

The **Refresh Graph Data** button triggers a re-scan of all repositories in the configured GitHub organization. Use this after new learning exercises have been added to the organization or existing ones have been updated.

### What happens

1. The backend fetches the list of all repositories in the GitHub organization.
2. Repositories with a UUID name are checked for new commits (SHA-based, incremental).
3. For each changed repository, the README is fetched and the embedded JSON-LD is extracted and saved.
4. The graph database is rebuilt from the updated data.

### Behavior

- The operation runs as a background task. The button returns immediately - the scan continues in the background.
- Progress can be followed in the container logs: `docker logs -f <container-name>`
- Re-running while a scan is already in progress starts a second background task. Avoid triggering multiple refreshes at once.
- Repositories that have not changed since the last scan are skipped.

---

## Managing All Learning Paths

Admins see all learning paths created by all teachers, not just their own. This allows removing outdated or inappropriate paths regardless of who created them.

Path management works the same way as for teachers - see `Doc_Teacher.md` for details.
