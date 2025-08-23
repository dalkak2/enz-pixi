import { EntryContainer } from "../mod.ts"
import { Module, toRadian, toDegrees } from "../Module.ts"

export class Moving extends Module {
    move_direction(n: number, obj: EntryContainer) {
        obj.x += n * Math.sin(toRadian(obj.direction))
        obj.y += n * Math.cos(toRadian(obj.direction))
        obj.emit("move")
    }
    move_x(n: number, obj: EntryContainer) {
        obj.x += n
        obj.emit("move")
    }
    move_y(n: number, obj: EntryContainer) {
        obj.y += n
        obj.emit("move")
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
    rotate_relative(angle: number, obj: EntryContainer) {
        obj.rotation += angle
    }
    direction_relative(angle: number, obj: EntryContainer) {
        obj.direction += angle
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
