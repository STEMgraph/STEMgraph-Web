# STEMgraph - Guide for Students

## What is STEMgraph?

STEMgraph is a platform that presents IT learning exercises as an interactive 3D graph. Each node represents one learning exercise, with the corresponding lessons hosted on GitHub. Connections between nodes indicate which prior knowledge an exercise requires, making it immediately visible in which order topics should be worked through. With every lesson mastered, new pathways of knowledge open up before you.

---

## Login

The graph can be viewed and searched without logging in. 
An account is required to track personal learning progress.

- Log in via the **Login** button in the menu
- After logging in, your name and role appear in the menu bar
- Log out via the **Logout** button

---

## Orientation in the Graph

### Node Shapes

| Shape | Meaning |
|---|---|
| Cone (blue) | Entry point - this exercise has no prerequisites |
| Box (orange) | Exit point - no other exercise depends on this one |
| Sphere | Regular exercise with prerequisites |

### Node Colors (visible after login)

| Color | Meaning |
|---|---|
| Light blue | This exercise has been marked as completed |
| Yellow-orange | This exercise is on the todo list |
| Light grey | Not yet worked on |

### Navigating the Graph

- **Rotate** - hold left mouse button and drag
- **Zoom** - mouse wheel
- **Pan** - hold right mouse button and drag
- **Reset zoom** - Space key or button in the menu
- **Go back** - Left arrow key or button in the menu

## Keyboard Shortcuts

| Key | Action |
|---|---|
| Escape | Close open panel |
| Space | Reset zoom to fit the entire graph |
| Arrow Left | Navigate one step back in graph history |
| Ctrl + Z | Navigate one step back in graph history |
| F1 | Open help panel |

---

### Load the Full Graph

**Whole Graph** in the menu reloads the complete graph at any time.

### Keyword Search

The search field in the menu allows searching by keyword. The graph then shows only exercises tagged with that keyword. Known keywords are suggested while typing.

### Keyword Cloud

The **Keyword Cloud** button displays all existing keywords as a graph. The size of each sphere reflects the frequency of the keyword. Clicking a keyword loads the corresponding subgraph.

---

## Exploring an Exercise

Clicking on a node opens an information panel showing:

- The topic of the exercise (`teaches` field)
- The UUID of the node
- Assigned keywords
- Action buttons

### Available Actions in the Information Panel

| Button | Function |
|---|---|
| Explore | Shows the subgraph with all prerequisites of this exercise |
| Open on GitHub | Opens the corresponding repository on GitHub (task description, materials) |
| Mark lesson as completed | Mark the exercise as completed (requires login) |
| Put lesson on your To-Do list | Add the exercise to the todo list (requires login) |

---

## Tracking Learning Progress

### Todo List

Exercises can be added to the todo list via the information panel. The **To-Do Graph** button in the menu displays a subgraph containing all exercises on the todo list.

### Completed Exercises

Completed exercises are shown in light blue in the graph. Completion can be undone at any time.

### Statistics

The **Statistics** button in the menu shows an overview of:

- Number of completed exercises
- Number of exercises on the todo list
- Total number of exercises on the platform
- A progress bar showing the percentage of completed exercises

---

## Learning Paths

Teachers and admins can create curated learning paths and share them via UUID.

### Loading a Learning Path by UUID

1. Open **Learning Paths** in the menu
2. Enter the UUID of the learning path and click **Lookup**
3. Click **Load Graph** to display the path in the graph
4. Click **Add to Todo** to add all exercises in the path to the todo list at once

### Loading a Learning Path via URL

Learning paths can also be opened directly via URL:

```
https://stemgraph.<domain>/?path=<path-uuid>
```