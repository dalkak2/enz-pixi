import { Module } from "../Module.ts"
import { EntryBrush } from "../obj/mod.ts"

// todo: Remove `extends Module`
export class Brush extends Module {
    color(str: string) {
        return str
    }
    start_drawing(obj: EntryBrush) {
        const { graphics, lineListener } = obj.getStrokeBrush(graphics => {
            obj.addSibling(this, graphics, 0)
            obj.hasStrokeBrush = true
        })
        graphics.moveTo(
            obj.pixiSprite.x,
            obj.pixiSprite.y,
        )
        obj.on("move", lineListener)
    }
    stop_drawing(obj: EntryBrush) {
        if (obj._lineListener) {
            obj.off("move", obj._lineListener)
        }
    }
    set_color(color: string, obj: EntryBrush) {
        obj.strokeColor = color
    }
    change_thickness(n: number, obj: EntryBrush) {
        obj.strokeThickness += n
    }
    set_thickness(n: number, obj: EntryBrush) {
        obj.strokeThickness = n
    }
    change_brush_transparency(n: number, obj: EntryBrush) {
        obj.brushTransparency += n
    }
    /**
     * "TRAN-PARENCY!"
     */
    set_brush_tranparency(n: number, obj: EntryBrush) {
        obj.brushTransparency = n
    }
    brush_erase_all(obj: EntryBrush) {
        obj._strokeBrush?.destroy()
        delete obj._strokeBrush
        obj.hasStrokeBrush = false
        this.stop_drawing(obj)
    }
}
