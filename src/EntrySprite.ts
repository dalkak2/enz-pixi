import type { Object_ } from "../deps/enz.ts"
import {
    Sprite,
    EventEmitter,
    Text,
    Container,
} from "../deps/pixi.ts"
import type { Entry } from "./Entry.ts"

export class EntrySprite extends EventEmitter {
    textureIds: string[] = []
    currentTextureIndex = 0
    direction = 0
    scene
    isClone = false

    pixiSprite: Container
    objectType: string

    constructor(data: {
        scene: string,
        objectType: string,
    }) {
        super()
        if (data.objectType == "sprite") {
            this.pixiSprite = new Sprite()
        } else if (data.objectType == "textBox") {
            this.pixiSprite = new Text({ text: "Hello", renderMode: "html" })
        } else {
            throw new Error(`Unknown objectType: ${data.objectType}`)
        }
        this.objectType = data.objectType
        this.scene = data.scene
    }
    get size() {
        return (this.pixiSprite.width + this.pixiSprite.height) / 2
    }
    set size(newSize: number) {
        const scale = Math.max(1, newSize) / this.size
        this.pixiSprite.scale.x *= scale
        this.pixiSprite.scale.y *= scale
    }
    get x() {
        return this.pixiSprite.x - 240
    }
    set x(x: number) {
        this.pixiSprite.x = x + 240
    }
    get y() {
        return -this.pixiSprite.y + 135
    }
    set y(y: number) {
        this.pixiSprite.y = -y + 135
    }
    get rotation() { return this.pixiSprite.angle }
    set rotation(a: number) { this.pixiSprite.angle = a }
    get visible() { return this.pixiSprite.visible }
    set visible(b: boolean) { this.pixiSprite.visible = b }
    get transparency() {
        return (1 - this.pixiSprite.alpha) * 100
    }
    set transparency(n: number) {
        this.pixiSprite.alpha = 1 - (n / 100)
    }

    destroy() {
        this.pixiSprite.destroy()
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
            objectType,
        }: Object_,
        project: Entry,
    ) {
        const sprite = new this({ scene, objectType })
        const pixiSprite = sprite.pixiSprite

        sprite.textureIds = pictures.map(
            ({id}) => id
        )
        sprite.currentTextureIndex = sprite.textureIds.indexOf(selectedPictureId)
        pixiSprite?.anchor?.set(0.5)
        sprite.x = entity.x
        sprite.y = entity.y
        pixiSprite.scale = {
            x: entity.scaleX,
            y: entity.scaleY,
        }
        sprite.rotation = entity.rotation
        sprite.direction = entity.direction
        sprite.visible = entity.visible
        project.scenes[sprite.scene].addChildAt(pixiSprite, 0)
        return sprite
    }
    clone(project: Entry) {
        const sprite = new (this.constructor as new (data: { scene: string, objectType: string }) => this)({
            scene: this.scene,
            objectType: this.objectType,
        })        
        const pixiSprite = sprite.pixiSprite

        sprite.textureIds = this.textureIds
        sprite.currentTextureIndex = this.currentTextureIndex
        pixiSprite.texture = this.pixiSprite.texture
        pixiSprite?.anchor?.set(0.5)
        sprite.x = this.x
        sprite.y = this.y
        sprite.size = this.size
        sprite.rotation = this.rotation
        sprite.direction = this.direction
        sprite.visible = this.visible

        sprite.isClone = true

        const myPos = project.scenes[sprite.scene].children.findIndex(x => x == this.pixiSprite)
        
        project.scenes[sprite.scene].addChildAt(sprite.pixiSprite, myPos)
        
        sprite.emit("clone")

        return sprite
    }
}