import type { Object_ } from "../deps/enz.ts"
import {
    Sprite,
    EventEmitter,
    Text,
    Container,
} from "../deps/pixi.ts"
import type { Entry } from "./Entry.ts"

interface EntryContainerData {
    x: number
    y: number
    rotation: number
    direction: number
    size: number
    visible: boolean
    transparency: number
    currentTextureIndex: number
    isClone: boolean

    id: string
    name: string
    scene: string
    objectType: string
    textureIds: string[]
}

export abstract class EntryContainer extends EventEmitter {
    direction: number
    currentTextureIndex: number
    isClone: boolean

    id: string
    name: string
    scene: string
    objectType: string
    textureIds: string[]

    abstract pixiSprite: Container

    constructor(data: EntryContainerData) {
        super()
        this.init()
        this.x = data.x
        this.y = data.y
        this.rotation = data.rotation
        this.direction = data.direction
        this.size = data.size*0.1
        this.visible = data.visible
        this.transparency = data.transparency
        this.currentTextureIndex = data.currentTextureIndex
        this.isClone = data.isClone

        this.id = data.id
        this.name = data.name
        this.scene = data.scene
        this.objectType = data.objectType
        this.textureIds = data.textureIds
    }

    /** Initialize this.pixiSprite */
    abstract init(): void

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
            id,
            name,
            selectedPictureId,
            scene,
            entity,
            sprite: {
                pictures,
                // sounds,
            },
            objectType,
        }: Object_,
        project: Entry,
    ) {
        const textureIds = pictures.map(
            ({id}) => id
        )
        const sprite = new (this as unknown as new (data: EntryContainerData) => EntryContainer)({
            ...entity,
            id,
            name,
            size: (entity.width + entity.height) / 2,
            textureIds,
            currentTextureIndex: textureIds.indexOf(selectedPictureId),
            transparency: 0,
            isClone: false,
            scene,
            objectType,
        })
        const pixiSprite = sprite.pixiSprite
        pixiSprite.scale.x = entity.scaleX
        pixiSprite.scale.y = entity.scaleY
        project.scenes[sprite.scene].addChildAt(pixiSprite, 0)

        return sprite
    }
    clone(project: Entry) {
        const sprite = new (this.constructor as new (data: EntryContainerData) => this)({
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

        pixiSprite.scale = this.pixiSprite.scale

        const myPos = project.scenes[sprite.scene].children.findIndex(x => x == this.pixiSprite)
        project.scenes[sprite.scene].addChildAt(sprite.pixiSprite, myPos)
        
        sprite.emit("clone")

        return sprite
    }
}

export class EntrySprite extends EntryContainer {

    declare pixiSprite: Sprite

    init() {
        this.pixiSprite = new Sprite()
        this.pixiSprite.anchor.set(0.5)
    }
    clone(project: Entry) {
        const sprite = super.clone(project)
        sprite.pixiSprite.texture = this.pixiSprite.texture
        return sprite
    }
}

export interface EntryTextData extends EntryContainerData {
    font: string
    colour: string
    text: string
    textAlign: 0 | 1 | 2
    lineBreak: boolean
    bgColor: string
    underLine: boolean
    strike: boolean
    fontSize: number
}

export class EntryText extends EntryContainer {
    
    declare pixiSprite: Text

    font
    colour
    lineBreak
    bgColor
    underLine
    strike

    get text() { return this.pixiSprite.text }
    set text(text: string) { this.pixiSprite.text = text }

    get textAlign() {
        return ({
            center: 0,
            left: 1,
            right: 2,
        } as const)[this.pixiSprite.style.align as "center" | "left" | "right"]
    }
    set textAlign(i: 0 | 1 | 2) {
        this.pixiSprite.style.align = ([
            "center",
            "left",
            "right",
        ] as const)[i]
    }
    
    get fontSize() { return this.pixiSprite.style.fontSize }
    set fontSize(fontSize: number) { this.pixiSprite.style.fontSize = fontSize }

    constructor(data: EntryTextData) {
        super(data)
        this.font = data.font
        this.colour = data.colour
        this.text = data.text
        this.textAlign = data.textAlign
        this.lineBreak = data.lineBreak
        this.bgColor = data.bgColor
        this.underLine = data.underLine
        this.strike = data.strike
        this.fontSize = data.fontSize

        if (data.lineBreak) {
            this.pixiSprite.anchor.set(0.5)
        } else {
            this.pixiSprite.anchor.set([
                0.5, // center
                0,   // left
                1,   // right
            ][this.textAlign], 0.5)
        }
    }

    init() {
        this.pixiSprite = new Text({
            renderMode: "html",
        })
    }
}