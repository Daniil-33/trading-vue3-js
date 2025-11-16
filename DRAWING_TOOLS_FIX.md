# Drawing Tools Fix - Vue 3 Migration

## Problem
Drawing tools (LineTool, RangeTool) were not rendering on the canvas despite the toolbar working correctly. The pins would emit `change-settings` events, but the tool settings (`p1`, `p2`) remained `null`.

## Root Cause
**Vue 3 Event System Change**: In Vue 2, the overlay.js mixin could override `this.$emit` to intercept all events. In Vue 3, this pattern no longer works because the emit function cannot be reassigned.

This caused Pin events to be emitted but never processed by the DataCube, leaving the tool coordinates uninitialized.

## Solution

### 1. Added `dc` prop to overlay.js mixin
**File**: `src/mixins/overlay.js`
```javascript
props: [
    'id', 'num', 'interval', 'cursor', 'colors',
    'layout', 'sub', 'data', 'settings', 'grid_id',
    'font', 'config', 'meta', 'tf', 'i0', 'last', 'dc'  // Added 'dc'
],
```

### 2. Modified Pin to call custom_event() directly
**File**: `src/components/primitives/pin.js`

Instead of just using `this.comp.$emit()`, Pin now checks if `custom_event()` method exists and calls it directly:

```javascript
// Vue 3: Use custom_event if available, otherwise use $emit
if (this.comp.custom_event) {
    this.comp.custom_event('change-settings', {
         [this.name]: [this.t, this.y$]
    })
} else {
    this.comp.$emit('change-settings', {
         [this.name]: [this.t, this.y$]
    })
}
```

### 3. Initialized p1/p2 properties in dc_events.js
**File**: `src/helpers/dc_events.js`

Ensured Vue 3 reactivity by initializing properties before they're set:

```javascript
build_tool(type) {
    // ... existing code ...
    let sett = Object.assign({}, proto.settings || {})
    
    // Initialize pin properties for Vue 3 reactivity
    if (!('p1' in sett)) sett.p1 = null
    if (!('p2' in sett)) sett.p2 = null
    
    // ... rest of code ...
}
```

### 4. Simplified overlay.js mounted hook
**File**: `src/mixins/overlay.js`

Removed the failed `$emit` override attempt and kept only the native emit:

```javascript
mounted() {
    // ... existing code ...
    
    // Vue 3: Cannot override $emit, so we keep the original
    this._$emit = this.$emit
    
    // ... rest of code ...
}
```

## Files Modified
1. `src/mixins/overlay.js` - Added `dc` prop, removed $emit override
2. `src/components/primitives/pin.js` - Call `custom_event()` directly
3. `src/helpers/dc_events.js` - Initialize p1/p2 for reactivity
4. `src/components/Chart.vue` - Pass `dc` prop (already done)
5. `src/components/Grid.vue` - Accept and pass `dc` prop (already done)

## Testing
After the fix:
1. Select LineTool from toolbar
2. Click on chart to set first point (p1)
3. Move mouse and click to set second point (p2)
4. Line should render between the two points
5. Tool automatically switches back to Cursor mode

The same applies to RangeTool (Price, Time, PriceTime modes).

## Event Flow
```
Pin.update()
  → comp.custom_event('change-settings', {p1: [t, y$]})
    → overlay.js custom_event() [adds grid_id, id]
      → emit('custom-event', {event: 'change-settings', args: [...]})
        → Grid.layer_events['onCustom-event']
          → Grid emit('custom-event')
            → Section emit('custom-event')
              → Chart emit('custom-event')
                → TradingVue custom_event()
                  → DataCube.on_custom_event()
                    → DataCube.change_settings()
                      → Updates settings.p1, settings.p2
                        → Vue reactivity triggers LineTool re-render
                          → draw() renders line on canvas
```

## Key Insight
In Vue 3, event interception must be done through **explicit method calls** rather than prototype manipulation. The `custom_event()` method in overlay.js serves as the proper event gateway, formatting events with metadata (grid_id, overlay id) before emitting them to the parent component chain.
