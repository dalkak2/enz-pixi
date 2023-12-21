import type { Object_ } from "../deps/enz.ts"
import {
    Sprite,
    EventEmitter,
    Text,
    Container,
} from "../deps/pixi.ts"
import type { Entry } from "./Entry.ts"

interface EntryObject {
    x: number
    y: number
    rotation: number
    direction: number
    size: number
    visible: boolean
    transparency: number
    currentTextureIndex: number
    isClone: boolean

    scene: string
    objectType: string
    textureIds: string[]
}

export class EntrySprite extends EventEmitter {
    direction: number
    currentTextureIndex: number
    isClone: boolean

    scene: string
    objectType: string
    textureIds: string[]

    pixiSprite: Container

    constructor(data: EntryObject) {
        super()
        if (data.objectType == "sprite") {
            this.pixiSprite = new Sprite()
        } else if (data.objectType == "textBox") {
            this.pixiSprite = new Text({ text: "Hello", renderMode: "html" })
        } else {
            throw new Error(`Unknown objectType: ${data.objectType}`)
        }
        this.x = data.x
        this.y = data.y
        this.rotation = data.rotation
        this.direction = data.direction
        this.size = data.size*0.1
        this.visible = data.visible
        this.transparency = data.transparency
        this.currentTextureIndex = data.currentTextureIndex
        this.isClone = data.isClone

        this.scene = data.scene
        this.objectType = data.objectType
        this.textureIds = data.textureIds
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
        const textureIds = pictures.map(
            ({id}) => id
        )
        const sprite = new this({
            ...entity,
            size: (entity.width + entity.height) / 2,
            textureIds,
            currentTextureIndex: textureIds.indexOf(selectedPictureId),
            transparency: 0,
            isClone: false,
            scene,
            objectType,
        })
        const pixiSprite = sprite.pixiSprite
        // TODO: Move this to constructor
        pixiSprite?.anchor?.set(0.5)
        pixiSprite.scale.x = entity.scaleX
        pixiSprite.scale.y = entity.scaleY
        project.scenes[sprite.scene].addChildAt(pixiSprite, 0)

        return sprite
    }
    clone(project: Entry) {
        const sprite = new (this.constructor as new (data: EntryObject) => this)({
            ...this,

            // Object spread doesn't contain getters
            size: this.size,
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            visible: this.visible,
            transparency: this.transparency,

            isClone: true,
        })
        const pixiSprite = sprite.pixiSprite

        pixiSprite.texture = this.pixiSprite.texture
        pixiSprite.scale = this.pixiSprite.scale
        pixiSprite?.anchor?.set(0.5)

        const myPos = project.scenes[sprite.scene].children.findIndex(x => x == this.pixiSprite)
        project.scenes[sprite.scene].addChildAt(sprite.pixiSprite, myPos)
        
        sprite.emit("clone")

        return sprite
    }
}