import { EntryContainer } from "../mod.ts"
import { Module } from "../Module.ts"

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

    soundStart(soundId: string, offset?: number, duration?: number) {
        return new Promise(o => {
            const source = this.audioContext.createBufferSource()

            const { nodes, buffer } = this.sounds.get(soundId)!

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
    sound_something_with_block(soundId: string) {
        this.sound_something_wait_with_block(soundId)
    }
    sound_something_second_with_block(
        soundId: string,
        duration: number,
    ) {
        this.sound_something_second_wait_with_block(soundId, duration)
    }
    sound_from_to(
        soundId: string,
        from: number,
        to: number,
    ) {
        this.sound_from_to_and_wait(soundId, from, to)
    }
    async sound_something_wait_with_block(soundId: string) {
        await this.soundStart(soundId)
    }
    async sound_something_second_wait_with_block(
        soundId: string,
        duration: number,
    ) {
        await this.soundStart(
            soundId,
            0,
            duration,
        )
    }
    async sound_from_to_and_wait(
        soundId: string,
        from: number,
        to: number,
    ) {
        await this.soundStart(
            soundId,
            from,
            to - from,
        )
    }
    get_sound_duration(soundId: string) {
        return this.sounds.get(soundId)!.buffer.duration
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
    play_bgm(soundId: string) {
        this.sound_something_with_block(soundId)
    }
    sound_silent_all(
        target: "all" | "thisOnly" | "other_objects",
        obj: EntryContainer,
    ) {
        if (target == "all") {
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
}
