import { EntryContainer } from "../mod.ts"
import { Module } from "../Module.ts"
import { numberNormalize } from "../util/basic.ts";
import { yet } from "../util/blockDeco.ts"

class SoundInfo {
    buffer
    parentId
    nodes = new Set<AudioBufferSourceNode>

    constructor(buffer: AudioBuffer, parentId: string) {
        this.buffer = buffer
        this.parentId = parentId
    }

    stopAll() {
        this.nodes.forEach(x => x.stop())
        this.nodes.clear()
    }
}

export class Sound extends Module {
    sounds: Map<string, SoundInfo> = new Map()
    
    audioContext = new AudioContext()
    gainNode = this.audioContext.createGain()
    get volume() {
        return this.gainNode.gain.value * 100
    }
    set volume(n: number) {
        this.gainNode.gain.value = n / 100
    }

    constructor() {
        super()
        this.gainNode.connect(this.audioContext.destination)
    }

    override async init() {
        this.need(
            "sound",
            this.project.objects.flatMap(x => x.sprite.sounds).length,
        )
        this.sounds = new Map(await Promise.all(
            this.project.objects.map(({ sprite, ...obj }) =>
                sprite.sounds.map(
                    async ({id, fileurl, filename, ext, name: _}) => {
                        const url = `/sound/${
                            filename
                            ? (filename + (ext || ".mp3"))
                            : fileurl!.substring(1)
                        }`

                        const audioBuffer = await fetch(url)
                            .then(res => res.arrayBuffer())
                            .then(buffer => this.audioContext.decodeAudioData(buffer))
                        this.got("sound")

                        return [
                            id,
                            new SoundInfo(
                                audioBuffer,
                                obj.id,
                            ),
                        ] as const
                    }
                )
            )
            .flat()
        ))
    }

    // util

    getSound(soundIdOrIndex: string | number) {
        soundIdOrIndex = numberNormalize(soundIdOrIndex)
        if (typeof soundIdOrIndex == "string") {
            return this.sounds.get(soundIdOrIndex)!
        } else {
            return this.sounds.values().toArray()[soundIdOrIndex-1]!
        }
    }
    soundStart(
        soundIdOrIndex: string | number,
        offset?: number,
        duration?: number,
    ) {
        return new Promise(o => {
            const source = this.audioContext.createBufferSource()

            const { nodes, buffer } = this.getSound(soundIdOrIndex)

            nodes.add(source)

            source.buffer = buffer
            source.connect(this.gainNode)
            source.addEventListener("ended", e => {
                o(e)
                nodes.delete(source)
            })
            source.start(
                this.audioContext.currentTime,
                offset,
                duration,
            )
        })
    }

    // blocks

    get_sounds(id: string) {
        return id
    }
    sound_something_with_block(soundIdOrIndex: string | number) {
        this.sound_something_wait_with_block(soundIdOrIndex)
    }
    sound_something_second_with_block(
        soundIdOrIndex: string | number,
        duration: number,
    ) {
        this.sound_something_second_wait_with_block(soundIdOrIndex, duration)
    }
    sound_from_to(
        soundIdOrIndex: string | number,
        from: number,
        to: number,
    ) {
        this.sound_from_to_and_wait(soundIdOrIndex, from, to)
    }
    async sound_something_wait_with_block(soundIdOrIndex: string | number) {
        await this.soundStart(soundIdOrIndex)
    }
    async sound_something_second_wait_with_block(
        soundIdOrIndex: string | number,
        duration: number,
    ) {
        await this.soundStart(
            soundIdOrIndex,
            0,
            duration,
        )
    }
    async sound_from_to_and_wait(
        soundIdOrIndex: string | number,
        from: number,
        to: number,
    ) {
        await this.soundStart(
            soundIdOrIndex,
            from,
            to - from,
        )
    }
    get_sound_duration(soundIdOrIndex: string | number) {
        return this.getSound(soundIdOrIndex).buffer.duration
    }
    get_sound_volume() {
        return this.volume
    }
    sound_volume_change(n: number) {
        this.sound_volume_set(this.volume + n)
    }
    sound_volume_set(n: number) {
        this.volume = Math.min(Math.max(0, n), 100)
    }
    @yet get_sound_speed() {
        
    }
    @yet sound_speed_change() {

    }
    @yet sound_speed_set() {

    }
    // todo: find more elegance way to do this
    sound_silent_all(
        target: "all" | "thisOnly" | "other_objects",
        obj: EntryContainer,
    ): void
    /**
     * 예전 작품은 param 없이 '모든 소리 멈추기'임 (#105)
     * @param obj 
     */
    sound_silent_all(obj: EntryContainer): void
    sound_silent_all(
        ...args: [
            ...["all" | "thisOnly" | "other_objects"] | [],
            EntryContainer,
        ]
    ) {
        const target = args.slice(0, -1)[0] as "all" | "thisOnly" | "other_objects" | undefined
        const obj = args.slice(-1)[0] as EntryContainer

        if (target == "all" || target == undefined) {
            this.sounds.forEach(x => x.stopAll())
        }
        if (target == "thisOnly") {
            this.sounds.values()
                .filter(x => x.parentId == obj.id)
                .forEach(x => x.stopAll())
        }
        if (target == "other_objects") {
            this.sounds.values()
                .filter(x => x.parentId != obj.id)
                .forEach(x => x.stopAll())
        }
    }
    play_bgm(soundIdOrIndex: string | number) {
        this.sound_something_with_block(soundIdOrIndex)
    }
    @yet stop_bgm() {
        
    }
}
