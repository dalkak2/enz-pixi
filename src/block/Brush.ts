import { Module } from "../Module.ts"
import { EntryBrush } from "../obj/mod.ts"

// todo: Remove `extends Module`
export class Brush extends Module {
    color(str: string) {
        return str
    }
    start_drawing(obj: EntryBrush) {
        obj.start_drawing(this)
    }
    stop_drawing(obj: EntryBrush) {
        obj.stop_drawing()
    }
    set_color(color: string, obj: EntryBrush) {
        obj.strokeColor = color
        obj.pushStrokeInst()
    }
    change_thickness(n: number, obj: EntryBrush) {
        obj.strokeThickness += n
        obj.pushStrokeInst()
    }
    set_thickness(n: number, obj: EntryBrush) {
        obj.strokeThickness = n
        obj.pushStrokeInst()
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
