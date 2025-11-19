<script>
// Line drawing tool
// TODO: make an angle-snap when "Shift" is pressed

import Overlay from '../../mixins/overlay.js'
import Tool from '../../mixins/tool.js'
import Icons from '../../stuff/icons.json'
import Pin from '../primitives/pin.js'
import Seg from '../primitives/seg.js'
import Line from '../primitives/line.js'
import Ray from '../primitives/ray.js'

export default {
    name: 'LineTool',
    mixins: [Overlay, Tool],
    emits: ['drawing-mode-off', 'scroll-lock', 'object-selected', 'change-settings', 'remove-tool'],
    methods: {
        meta_info() {
            return { author: 'C451', version: '1.1.0' }
        },
        tool() {
            return {
                // Descriptor for the tool
                group: 'Lines', icon: Icons['segment.png'],
                type: 'Segment',
                hint: 'This hint will be shown on hover',
                data: [],     // Default data
                settings: {}, // Default settings
                // Modifications
                mods: {
                    'Extended': {
                        // Rewrites the default setting fields
                        settings: { extended: true },
                        icon: Icons['extended.png']
                    },
                    'Ray': {
                        // Rewrites the default setting fields
                        settings: { ray: true },
                        icon: Icons['ray.png']
                    }
                }
            }
        },
        // Called after overlay mounted
        init() {
            console.log('🔧 LineTool.init() called')
            console.log('   Current settings:', this.$props.settings)
            
            // First pin is settled at the mouse position
            this.pins.push(new Pin(this, 'p1'))
            console.log('   ✅ Created pin p1')
            
            // Second one is following mouse until it clicks
            this.pins.push(new Pin(this, 'p2', {
                state: 'tracking'
            }))
            console.log('   ✅ Created pin p2 (tracking)')
            
            this.pins[1].on('settled', () => {
                console.log('   📍 Pin p2 settled - finishing drawing')
                // Call when current tool drawing is finished
                // (Optionally) reset the mode back to 'Cursor'
                // IMPORTANT: Only emit drawing-mode-off if this is initial creation
                // (state is NOT 'finished'). If already finished, this is just a drag.
                if (this.$props.settings.$state !== 'finished') {
                    this.set_state('finished')
                    // Vue 3: Use custom_event if available
                    if (this.custom_event) {
                        this.custom_event('drawing-mode-off')
                    } else {
                        this.$emit('drawing-mode-off')
                    }
                }
            })
        },
        draw(ctx) {
            console.log('🎨 LineTool.draw() called')
            console.log('   settings:', this.$props.settings)
            console.log('   p1:', this.p1)
            console.log('   p2:', this.p2)
            console.log('   sett:', this.sett)
            
            if (!this.p1 || !this.p2) {
                console.warn('   ⚠️ Skipped: p1 or p2 is null')
                return
            }

            console.log('   ✅ Drawing line from', this.p1, 'to', this.p2)
            
            ctx.lineWidth = this.line_width
            ctx.strokeStyle = this.color
            ctx.beginPath()

            if (this.sett.ray) {
                new Ray(this, ctx).draw(this.p1, this.p2)
            } else if (this.sett.extended) {
                new Line(this, ctx).draw(this.p1, this.p2)
            } else {
                new Seg(this, ctx).draw(this.p1, this.p2)
            }

            ctx.stroke()
            this.render_pins(ctx)

        },
        use_for() { return ['LineTool'] },
        data_colors() { return [this.color] }
    },
    // Define internal setting & constants here
    computed: {
        sett() {
            return this.$props.settings
        },
        p1() {
            return this.$props.settings?.p1
        },
        p2() {
            return this.$props.settings?.p2
        },
        line_width() {
            return this.sett?.lineWidth || 0.9
        },
        color() {
            return this.sett?.color || '#42b28a'
        }
    },
    data() {
        return {}
    }

}
</script>
