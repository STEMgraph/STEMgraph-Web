# STEMgraph - Guide for Teachers

## Role "teacher"

The **teacher** role includes all features of the **student** role plus additional tools for creating and managing personal learning paths. This guide covers only the extended features. For general platform usage see `Doc_Student.md`.

---

## Creating Learning Paths

Learning paths are curated sequences of learning exercises that can be visualized as a subgraph and shared via UUID.

### Create a New Learning Path

1. Open **Learning Paths** in the menu
2. Enter a name in the **New Path** field
3. Click **Create**
4. The new path appears in the list of your learning paths

---

## Adding Exercises to a Path

1. Click on a node in the graph to open the information panel
2. In the **Add to Path** section, select the desired learning path from the dropdown
3. Optional: check **Include dependencies** to automatically add not just the selected node but all of its prerequisites as well
4. Click **Add to Path**

---

## Managing Learning Paths

All your learning paths are accessible via **Learning Paths** in the menu.

### Available Actions per Learning Path

| Button | Function |
|---|---|
| Load Graph | Display the learning path as a graph |
| Edit | Edit the path - reorder or remove nodes, rename the path |
| Delete | Delete the learning path |

### Editing a Learning Path

In the edit view of a learning path:

- Individual nodes can be moved up or down using the arrow buttons
- Nodes can be removed using the X button
- The path name can be changed via the **Rename** button

### Sharing a Learning Path

Learning paths can be shared via UUID or via a direct link:

- **Copy UUID** - copies the path UUID to the clipboard
- **Copy URL** - copies a direct link to the clipboard

The direct link has the following format:

```
https://stemgraph.<domain>/?path=<path-uuid>
```

Anyone who receives the link can load the path (the usage of learning paths is not reduced to logged in users) and - after logging in - add all exercises in the path to their own todo list with a single click.

---

## Notes

- Each teacher sees and manages only their own learning paths.
- Deleting a learning path cannot be undone.
- Shared links become invalid once the path is deleted.