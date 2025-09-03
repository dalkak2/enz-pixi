import { Module } from "../Module.ts"
import { toRadian, toDegrees } from "../util/basic.ts"
import { EntryContainer } from "../obj/mod.ts"
import { yet } from "../util/blockDeco.ts"

export class Moving extends Module {
    move_direction(n: number, obj: EntryContainer) {
        obj.x += n * Math.sin(toRadian(obj.direction))
        obj.y += n * Math.cos(toRadian(obj.direction))
        obj.emit("move")
    }
    @yet bounce_wall() {

    }
    move_x(n: number, obj: EntryContainer) {
        obj.x += n
        obj.emit("move")
    }
    move_y(n: number, obj: EntryContainer) {
        obj.y += n
        obj.emit("move")
    }
    // todo: 일시정지 기능 추가할 시 Date.now() 대체해야함
    async move_xy_time(
        t: number,
        dx: number,
        dy: number,
        obj: EntryContainer,
    ) {
        t *= 1000

        const startAt = Date.now()
        let prevT = startAt

        while (Date.now() - startAt < t) {
            const dt = Date.now() - prevT
            obj.x += dt / t * dx
            obj.y += dt / t * dy

            prevT = Date.now()

            await this.wait_tick()
        }
    }
    locate_x(x: number, obj: EntryContainer) {
        obj.x = x
        obj.emit("move")
    }
    locate_y(y: number, obj: EntryContainer) {
        obj.y = y
        obj.emit("move")
    }
    locate_xy(x: number, y: number, obj: EntryContainer) {
        obj.x = x
        obj.y = y
        obj.emit("move")
    }
    @yet locate_xy_time() {

    }
    locate(objId: string, obj: EntryContainer) {
        if (objId == "mouse") {
            obj.x = this.mouse.x
            obj.y = this.mouse.y
        } else {
            obj.x = this.objects[objId].x
            obj.y = this.objects[objId].y
        }
        obj.emit("move", obj)
    }
    @yet locate_object_time() {

    }
    rotate_relative(angle: number, obj: EntryContainer) {
        obj.rotation += angle
    }
    direction_relative(angle: number, obj: EntryContainer) {
        obj.direction += angle
    }
    @yet rotate_by_time() {

    }
    @yet direction_relative_duration() {
        
    }
    rotate_absolute(angle: number, obj: EntryContainer) {
        obj.rotation = angle
    }
    direction_absolute(angle: number, obj: EntryContainer) {
        obj.direction = angle
    }
    see_angle_object(objId: string, obj: EntryContainer) {
        let target: { x: number, y: number }
        if (objId == "mouse") {
            target = this.mouse
        } else {
            target = this.objects[objId]
        }
        const dx = target.x - obj.x
        const dy = target.y - obj.y
        obj.rotation = - toDegrees(Math.atan(dy / dx)) - obj.direction + (dx > 0 ? 90 : 270)
    }
    move_to_angle(angle: number, n: number, obj: EntryContainer) {
        obj.x += n * Math.sin(toRadian(angle))
        obj.y += n * Math.cos(toRadian(angle))
        obj.emit("move")
    }
}
