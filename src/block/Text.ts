import { Module } from "../Module.ts"
import { EntryText } from "../obj/mod.ts"

export class Text extends Module {
    text_color(str: string) {
        return str
    }
    text_read(targetId: string, obj: EntryText) {
        const target =
            targetId == "self"
                ? obj
                : this.objects[targetId] as EntryText
        return target.text
    }
    text_write(str: string, obj: EntryText) {
        obj.text = str
    }
    text_append(str: string, obj: EntryText) {
        obj.text += str
    }
    text_prepend(str: string, obj: EntryText) {
        obj.text = str + obj.text
    }
    text_change_effect() {
        console.log("skip (todo):", "text_change_effect")
    }
    text_change_font() {
        console.log("skip (todo):", "text_change_font")
    }
    text_change_font_color(color: string, obj: EntryText) {
        obj.colour = color
    }
    text_change_bg_color() {
        console.log("skip (todo):", "text_change_bg_color")
    }
    text_flush(obj: EntryText) {
        obj.text = ""
    }
}
