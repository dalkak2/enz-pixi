import type { Object_ } from "../deps/enz.ts"
import { Sprite } from "../deps/pixi.ts"
import type { Entry } from "./Entry.ts"

export class EntrySprite extends Sprite {
    textureIds: string[] = []
    currentTextureIndex = 0
    direction = 0
    scene
    isClone = false

    constructor(data: { scene: string }) {
        super()
        this.scene = data.scene
    }
    get size() {
        return (this.width + this.height) / 2
    }
    set size(newSize: number) {
        const scale = Math.max(1, newSize) / this.size
        this.scale.x *= scale
        this.scale.y *= scale
    }
    static fromEntryData(
        {
            selectedPictureId,
            scene,
            entity,
            sprite: {
                pictures,
                sounds,
            },
        }: Object_,
        project: Entry,
    ) {
        const sprite = new this({ scene })
        sprite.textureIds = pictures.map(
            ({id}) => id
        )
        sprite.currentTextureIndex = sprite.textureIds.indexOf(selectedPictureId)
        sprite.anchor.set(0.5)
        sprite.x = entity.x + 240
        sprite.y = -entity.y + 135
        sprite.scale = {
            x: entity.scaleX,
            y: entity.scaleY,
        }
        sprite.angle = entity.rotation
        sprite.direction = entity.direction
        sprite.visible = entity.visible
        project.scenes[sprite.scene].addChildAt(sprite, 0)
        return sprite
    }
    clone(project: Entry) {
        const sprite = new (this.constructor as new (data: { scene: string }) => this)({
            scene: this.scene
        })
        sprite.textureIds = this.textureIds
        sprite.currentTextureIndex = this.currentTextureIndex
        sprite.texture = this.texture
        sprite.anchor.set(0.5)
        sprite.x = this.x
        sprite.y = this.y
        sprite.scale = this.scale
        sprite.angle = this.angle
        sprite.direction = this.direction
        sprite.visible = this.visible

        sprite.isClone = true

        const myPos = project.scenes[sprite.scene].children.findIndex(x => x == this)
        
        project.scenes[sprite.scene].addChildAt(sprite, myPos)
        
        sprite.emit("clone")

        return sprite
    }
}