export class Timer {
    checkpoint: number | false = false
    acc = 0
    get time() {
        return this.checkpoint
            ? this.acc + Date.now() - this.checkpoint
            : this.acc
    }
    start() {
        this.acc = this.time
        this.checkpoint = Date.now()
    }
    stop() {
        this.acc = this.time
        this.checkpoint = false
    }
    reset() {
        this.acc = 0
        this.checkpoint = Date.now()
    }
}