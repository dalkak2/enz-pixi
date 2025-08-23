import { Module, wait_second } from "../Module.ts"
import {
    EntryContainer,
    EntrySprite,
} from "../obj/mod.ts"

const mod =
    (a: number, n: number) =>
        ((a % n) + n) % n

const numberNormalize =
    // TODO: convert in server
    (numOrStr: number | string): number | string =>
        Number.isNaN(Number(numOrStr))
            ? numOrStr as string
            : Number(numOrStr) as number

export class Looks extends Module {
    
    get_pictures(id: string) {
        return id
    }
    show(obj: EntryContainer) {
        obj.visible = true
    }
    hide(obj: EntryContainer) {
        obj.visible = false
    }
    async dialog_time(
        text: string,
        sec: number,
        type: "speak" | "think",
        obj: EntryContainer,
    ) {
        console.log(
            `Object_${obj.id} ${obj.name} ${type}s:`,
            text,
        )
        await wait_second(sec)
    }
    dialog(text: string, type: "speak" | "think", obj: EntryContainer) {
        console.log(
            `Object_${obj.id} ${obj.name} ${type}s:`,
            text,
        )
    }
    remove_dialog() {
        console.log("skip:", "remove_dialog")
    }
    change_to_some_shape(shapeIdOrIndex: string | number, obj: EntrySprite) {
        // TODO: convert to number in server
        shapeIdOrIndex = numberNormalize(shapeIdOrIndex)
        if (typeof shapeIdOrIndex == "string") {
            const shapeId = shapeIdOrIndex
            // TODO: abstraction
            obj.currentTextureIndex = obj.textureIds.indexOf(shapeId)
            obj.pixiSprite.texture = this.textures[shapeId]
        } else {
            // TODO: handle edge case: ex) 0.5
            const index = shapeIdOrIndex - 1
            obj.currentTextureIndex = index
            obj.pixiSprite.texture = this.textures[obj.textureIds[index]]
        }
    }
    change_to_next_shape(type: "next" | "prev", obj: EntrySprite) {
        if (type == "next") {
            obj.currentTextureIndex += 1
        }
        if (type == "prev") {
            obj.currentTextureIndex -= 1
        }
        obj.currentTextureIndex =
            mod(
                obj.currentTextureIndex,
                obj.textureIds.length,
            )
        obj.pixiSprite.texture = this.textures[
            obj.textureIds[
                obj.currentTextureIndex
            ]
        ]
    }
    add_effect_amount(
        type:
            | "transparency"
            | "color"
            | "brightness",
        amount: number,
        obj: EntryContainer,
    ) {
        if (type == "transparency")
            obj.transparency += amount
        else throw new Error(`add_effect_amount - ${type} is not implemented yet.`)
    }
    change_effect_amount(
        type:
            | "transparency"
            | "color"
            | "brightness",
        amount: number,
        obj: EntryContainer,
    ) {
        if (type == "transparency")
            obj.transparency = amount
        else throw new Error(`add_effect_amount - ${type} is not implemented yet.`)
    }
    change_scale_size(d: number, obj: EntryContainer) {
        obj.size += d
    }
    set_scale_size(newSize: number, obj: EntryContainer) {
        obj.size = newSize
    }
    flip_x(obj: EntryContainer) {
        obj.pixiSprite.scale.y *= -1
    }
    flip_y(obj: EntryContainer) {
        obj.pixiSprite.scale.x *= -1
    }
    change_object_index(
        type:
            | "FRONT"
            | "FORWARD"
            | "BACKWARD"
            | "BACK",
        obj: EntryContainer,
    ) {
        const scene = this.scenes[obj.scene]
        let newIndex: number
        switch (type) {
            case "FRONT":
                newIndex = scene.children.length - 1
                break
            case "FORWARD":
                newIndex = Math.min(
                    scene.children.indexOf(obj.pixiSprite) + 1,
                    scene.children.length - 1,
                )
                break
            case "BACKWARD":
                newIndex = Math.max(
                    scene.children.indexOf(obj.pixiSprite) - 1,
                    0,
                )
                break
            case "BACK":
                newIndex = 0
                break
        }

        scene.setChildIndex(obj.pixiSprite, newIndex)
    }
}
