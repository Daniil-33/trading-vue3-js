
// Webworker interface

// Import worker using Vite's syntax
import ScriptWorker from './script_ww.js?worker'
import Utils from '../stuff/utils.js'

const HAS_WINDOW = typeof window !== 'undefined'

class WebWork {

    constructor(dc) {
        this.dc = dc
        this.tasks = {}
        this.onevent = () => {}
    if (HAS_WINDOW) this.start()
    }

    start() {
    if (!HAS_WINDOW) return
    if (this.worker) this.worker.terminate()
        // Create worker using Vite's worker import
        this.worker = new ScriptWorker()
        this.worker.onmessage = e => this.onmessage(e)
    }

    start_socket() {
        if (!this.dc.sett.node_url) return
        this.socket = new WebSocket(this.dc.sett.node_url)
        this.socket.addEventListener('message', e => {
            this.onmessage({data: JSON.parse(e.data)})
        })
        this.msg_queue = []
    }

    send(msg, tx_keys) {
        if (!HAS_WINDOW) return
        if (this.dc.sett.node_url) {
            return this.send_node(msg, tx_keys)
        }
        if (tx_keys) {
            let tx_objs = tx_keys.map(k => msg.data[k])
            if (this.worker) this.worker.postMessage(msg, tx_objs)
        } else {
            if (this.worker) this.worker.postMessage(msg)
        }
    }

    // Send to node.js via websocket
    send_node(msg, tx_keys) {
    if (!HAS_WINDOW) return
    if (!this.socket) this.start_socket()
        if (this.socket && this.socket.readyState) {
            // Send the old messages first
            while(this.msg_queue.length) {
                let m = this.msg_queue.shift()
                this.socket.send(JSON.stringify(m))
            }
            this.socket.send(JSON.stringify(msg))
        } else {
            this.msg_queue.push(msg)
        }
    }

    onmessage(e) {
        if (e.data.id in this.tasks) {
            this.tasks[e.data.id](e.data.data)
            delete this.tasks[e.data.id]
        } else {
            this.onevent(e)
        }
    }

    // Execute a task
    async exec(type, data, tx_keys) {
        return new Promise((rs, rj) => {
            let id = Utils.uuid()
            this.send({ type, id, data }, tx_keys)
            this.tasks[id] = res => {
                rs(res)
            }
        })
    }

    // Execute a task, but just fucking do it,
    // do not wait for the result
    just(type, data, tx_keys) {
        let id = Utils.uuid()
        this.send({ type, id, data }, tx_keys)
    }

    // Relay an event from iframe postMessage
    // (for the future)
    async relay(event, just = false) {
        return new Promise((rs, rj) => {
            this.send(event, event.tx_keys)
            if (!just) {
                this.tasks[event.id] = res => {
                    rs(res)
                }
            }
        })
    }

    destroy() {
        if (this.worker) this.worker.terminate()
    }
}

export default WebWork
