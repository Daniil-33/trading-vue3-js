# Drawing Tools Selection & Toolbar Fix

## Problems Fixed

### 1. Tool remains selected in toolbar after drawing completes
**Issue**: After finishing drawing (e.g., LineTool), the tool icon stays highlighted in the toolbar instead of automatically switching to Cursor.

**Root Cause**: The `drawing-mode-off` event was emitted but didn't trigger toolbar update because `$emit` in Vue 3 doesn't work the same way as Vue 2.

**Solution**: Modified LineTool and RangeTool to use `custom_event()` instead of `$emit()` for the `drawing-mode-off` event.

### 2. Clicking on drawn objects doesn't select them
**Issue**: After drawing a line, clicking on it doesn't re-select it (trash icon doesn't appear in toolbar).

**Root Cause**: The `object-selected` event was emitted without proper parameters and didn't pass through the `custom_event()` wrapper in Vue 3.

**Solution**: Modified tool.js mixin to use `custom_event()` for all overlay events in Vue 3.

## Changes Made

### 1. Tool Mixin (`src/mixins/tool.js`)
Updated all event emissions to use `custom_event()` when available (Vue 3 compatibility):

```javascript
// Before (Vue 2 style)
this.$emit('object-selected')
this.$emit('scroll-lock', true)
this.$emit('change-settings', {...})
this.$emit('remove-tool')

// After (Vue 3 compatible)
if (this.custom_event) {
    this.custom_event('object-selected')
} else {
    this.$emit('object-selected')
}
```

Events updated:
- `object-selected` - when clicking on a drawn tool
- `scroll-lock` - when starting/stopping drag
- `change-settings` - when changing tool state
- `remove-tool` - when deleting a tool

### 2. LineTool (`src/components/overlays/LineTool.vue`)
```javascript
// Updated drawing-mode-off emission
if (this.custom_event) {
    this.custom_event('drawing-mode-off')
} else {
    this.$emit('drawing-mode-off')
}
```

### 3. RangeTool (`src/components/overlays/RangeTool.vue`)
Same fix as LineTool for the `drawing-mode-off` event.

## How It Works

### Event Flow in Vue 3
```
Tool.js (mousedown on tool)
  → this.custom_event('object-selected')
    → overlay.js custom_event() [adds grid_id, id, uuid]
      → emit('custom-event', {event: 'object-selected', args: [grid_id, id, uuid]})
        → Grid → Section → Chart → TradingVue
          → DataCube.on_custom_event()
            → DataCube.object_selected([grid_id, id, uuid])
              → Sets $selected: true
              → Shows trash icon in toolbar
```

### Tool Selection Workflow
1. **Drawing Complete**: 
   - Tool emits `drawing-mode-off` via `custom_event()`
   - DataCube sets `data.tool = 'Cursor'`
   - Toolbar automatically updates (reactive)

2. **Click on Empty Space**:
   - Grid emits `grid-mousedown`
   - DataCube calls `object_selected([])` - deselects all
   - Trash icon removed from toolbar

3. **Click on Drawn Tool**:
   - Tool detects collision
   - Emits `object-selected` via `custom_event()`
   - DataCube sets `$selected: true` for that tool
   - Trash icon appears in toolbar

## Testing

### Test 1: Automatic Cursor Selection
1. Select LineTool from toolbar
2. Draw a line (click twice)
3. ✅ Cursor should automatically become active in toolbar
4. ✅ Line remains visible but not selected

### Test 2: Re-selecting Drawn Tools
1. Draw a line as above
2. Click on empty space on chart
3. ✅ Tool should deselect (no trash icon)
4. Click on the line
5. ✅ Line should select (trash icon appears)
6. ✅ You can drag the line
7. ✅ Delete button works

### Test 3: Multiple Tools
1. Draw multiple lines
2. Click each line
3. ✅ Only clicked line is selected
4. ✅ Previous selection is cleared
5. ✅ Trash icon always shows for selected tool

## Key Insight

In Vue 3, the overlay system can't intercept `$emit` calls through prototype manipulation. Instead, tools must explicitly call `custom_event()` method which:
1. Adds metadata (grid_id, overlay id, uuid)
2. Wraps the event in proper structure
3. Emits through the component chain to DataCube

This ensures all overlay events are properly processed and state management works correctly.
