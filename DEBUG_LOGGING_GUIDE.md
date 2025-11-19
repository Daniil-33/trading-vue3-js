# Debug Logging Guide for Drawing Tools

## Added Logging Points

### 1. Tool Selection (tool.js)
**Location**: `src/mixins/tool.js`

**Logs when clicking on a drawn tool:**
```
[Tool.mousedown] Collision detected
  - toolName: "LineTool" or "RangeTool"
  - selected: true/false (current selection state)
  - uuid: tool's unique identifier

[Tool.mousedown] Not selected, emitting object-selected
  - Only shown if tool was not already selected
```

**Logs when removing a tool:**
```
[Tool.remove_tool] Removing tool
  - toolName: name of the tool
  - uuid: tool identifier
```

### 2. Overlay Event Handling (overlay.js)
**Location**: `src/mixins/overlay.js`

**Logs every event passing through custom_event():**
```
[Overlay.custom_event]
  - overlay: component name
  - event: event name (e.g., 'object-selected', 'drawing-mode-off')
  - args: original arguments
  - grid_id, id, uuid: metadata

[Overlay.custom_event] Args after adding metadata
  - Shows args array after grid_id, id, uuid are added
```

### 3. LineTool Drawing Complete
**Location**: `src/components/overlays/LineTool.vue`

**Logs when drawing finishes:**
```
[LineTool.settled] Drawing finished, emitting drawing-mode-off
```

### 4. DataCube Event Processing (dc_events.js)
**Location**: `src/helpers/dc_events.js`

#### Main Event Router
```
[DataCube.on_custom_event]
  - event: event type
  - args: all arguments
```

#### Tool Selection Event
```
[DataCube.tool-selected]
  - args: [toolType, ...]

[DataCube.tool-selected] Set data.tool to: "LineTool" | "Cursor" | etc.
```

#### Grid Mouse Down (starting to draw)
```
[DataCube.grid_mousedown]
  - args: mouse event data
  - currentTool: currently selected tool
  - drawingMode: true/false
  - selected: currently selected object uuid

[DataCube.grid_mousedown] Starting drawing mode
  - Only when starting a new tool
```

#### Drawing Mode Off (switching to Cursor)
```
[DataCube.drawing-mode-off] Called

[DataCube.drawing_mode_off] Called
  - currentTool: tool before change
  - drawingMode: mode before change

[DataCube.drawing_mode_off] After: tool = "Cursor"
```

#### Object Selection
```
[DataCube.object-selected]
  - args: [grid_id, overlay_id, uuid]
  - currentSelected: currently selected object

[DataCube.object_selected] Deselecting: uuid
  - When deselecting previous object

[DataCube.object_selected] No args, deselected all
  - When clicking empty space

[DataCube.object_selected] Selecting: uuid
  - When selecting new object
```

#### Tool Removal
```
[DataCube.system_tool]
  - type: "Remove"
  - selected: uuid of object to remove

[DataCube.system_tool] Removing: uuid
```

### 5. Toolbar State (Toolbar.vue)
**Location**: `src/components/Toolbar.vue`

```
[Toolbar.selected]
  - tool: clicked tool object
  - currentTool: currently active tool from DataCube

[Toolbar.is_selected]
  - tool: tool being checked
  - selected: true/false
  - currentTool: current tool from DataCube
  - Only logged when selection changes
```

## Testing Scenarios

### Scenario 1: Draw a Line
**Expected Log Sequence:**
1. Click LineTool in toolbar:
   ```
   [Toolbar.selected] tool: LineTool, currentTool: Cursor
   [DataCube.on_custom_event] event: tool-selected
   [DataCube.tool-selected] Set data.tool to: Segment
   [Toolbar.is_selected] tool: Segment, selected: true
   ```

2. Click on chart to start:
   ```
   [DataCube.on_custom_event] event: grid-mousedown
   [DataCube.grid_mousedown] Starting drawing mode
   [Overlay.custom_event] event: change-settings (p1 set)
   ```

3. Move mouse and click to finish:
   ```
   [Overlay.custom_event] event: change-settings (p2 updates)
   [LineTool.settled] Drawing finished
   [Overlay.custom_event] event: drawing-mode-off
   [DataCube.drawing-mode-off] Called
   [DataCube.drawing_mode_off] After: tool = Cursor
   [Toolbar.is_selected] tool: Cursor, selected: true
   ```

### Scenario 2: Click on Empty Space
**Expected Log Sequence:**
```
[DataCube.on_custom_event] event: grid-mousedown
[DataCube.grid_mousedown]
[DataCube.on_custom_event] event: object-selected
[DataCube.object_selected] Deselecting: previous-uuid
[DataCube.object_selected] No args, deselected all
```

### Scenario 3: Click on Drawn Line
**Expected Log Sequence:**
```
[Tool.mousedown] Collision detected, toolName: LineTool
[Tool.mousedown] Not selected, emitting object-selected
[Overlay.custom_event] event: object-selected
[Overlay.custom_event] Args after adding metadata: [0, "LineTool_0", "uuid"]
[DataCube.on_custom_event] event: object-selected
[DataCube.object_selected] Selecting: uuid
```

### Scenario 4: Delete Selected Tool
**Expected Log Sequence:**
```
Click trash icon in toolbar:
[Toolbar.selected] tool: System:Remove
[DataCube.on_custom_event] event: tool-selected
[DataCube.system_tool] type: Remove, selected: uuid
[DataCube.system_tool] Removing: uuid
[DataCube.drawing_mode_off] After: tool = Cursor
```

## Common Issues to Look For

### Issue: Tool stays selected after drawing
**Check these logs:**
- Is `[DataCube.drawing-mode-off]` called?
- Does it show `After: tool = Cursor`?
- Does `[Toolbar.is_selected]` show Cursor as selected?

**Possible causes:**
- `custom_event()` not called (check [Overlay.custom_event])
- Event not reaching DataCube (check [DataCube.on_custom_event])
- Toolbar not reactive to tool change (check [Toolbar.is_selected])

### Issue: Can't select drawn tools by clicking
**Check these logs:**
- Is `[Tool.mousedown] Collision detected` shown?
- Is `[Overlay.custom_event] object-selected` emitted?
- Does `[DataCube.object_selected]` show "Selecting: uuid"?

**Possible causes:**
- No collision (tool.js collisions array empty)
- Event not properly formatted (check Args after adding metadata)
- UUID mismatch (compare UUIDs in logs)

### Issue: Clicking empty space doesn't deselect
**Check these logs:**
- Is `[DataCube.grid_mousedown]` called?
- Is `[DataCube.object_selected]` called with empty args?
- Does it show "No args, deselected all"?

**Possible causes:**
- grid-mousedown not emitted
- object_selected([]) not called
- Selected state not updating

### Issue: Toolbar showing wrong tool
**Check these logs:**
- Compare `currentTool` in [Toolbar.is_selected] with `data.tool` in DataCube logs
- Check if `dc.data.tool` path is correct (not `dc.tool`)

**Possible causes:**
- Wrong property path in Toolbar (`dc.tool` vs `dc.data.tool`)
- DataCube not reactive
- Toolbar not re-rendering

## How to Use

1. **Start dev server**: `npm run dev`
2. **Open browser console**: F12 or Cmd+Option+I
3. **Filter logs**: Type `[` in console filter to see only our logs
4. **Reproduce issue**: Follow one of the test scenarios above
5. **Compare logs**: Check if actual logs match expected sequence
6. **Identify gap**: Find where expected log is missing or shows wrong values
7. **Report issue**: Share the full console log showing the problem

## Quick Debug Checklist

When reporting an issue, include:
- [ ] Full console log from start to problem
- [ ] Which scenario you were testing
- [ ] At which step it failed
- [ ] Any error messages (red text in console)
- [ ] Screenshot of toolbar state vs expected state
