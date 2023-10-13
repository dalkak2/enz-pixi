import { autoDetectRenderer, Sprite, Container, Assets, Texture } from "https://esm.sh/v132/pixi.js@8.0.0-beta.5";
export const init = (project)=>new Entry(project);
const mod = (a, n)=>(a % n + n) % n;
const toRadian = (deg)=>deg * Math.PI / 180;
const toDegrees = (rad)=>rad * 180 / Math.PI;
export class EntrySprite extends Sprite {
    textureIds = [];
    currentTextureIndex = 0;
    constructor(...args){
        super(...args);
    }
    get size() {
        return (this.width + this.height) / 2;
    }
    set size(newSize) {
        const scale = Math.max(1, newSize) / this.size;
        this.scale.x *= scale;
        this.scale.y *= scale;
    }
}
export class Timer {
    checkpoint = false;
    acc = 0;
    get time() {
        return this.checkpoint ? this.acc + Date.now() - this.checkpoint : this.acc;
    }
    start() {
        this.acc = this.time;
        this.checkpoint = Date.now();
    }
    stop() {
        this.acc = this.time;
        this.checkpoint = false;
    }
    reset() {
        this.acc = 0;
        this.checkpoint = Date.now();
    }
}
export class Entry {
    project;
    renderer;
    events;
    scenes = {};
    variables = {};
    textures = {};
    objects = {};
    pressedKeys = {};
    timer = new Timer();
    constructor(project){
        this.project = project;
        this.events = {
            start: []
        };
    }
    async init(parent) {
        this.scenes = Object.fromEntries(this.project.scenes.map(({ id  })=>{
            const container = new Container();
            return [
                id,
                container
            ];
        }));
        this.variables = Object.fromEntries(this.project.variables.map(({ id , value  })=>{
            return [
                id,
                value
            ];
        }));
        this.textures = Object.fromEntries(await Promise.all(this.project.objects.map(({ sprite  })=>sprite.pictures.map(async ({ id , fileurl , filename , imageType  })=>{
                const url = `/image/${filename ? filename + `.${imageType}` : fileurl.substring(1)}`;
                await Assets.load(url);
                const texture = Texture.from(url);
                return [
                    id,
                    texture
                ];
            })).flat()));
        console.log(this.textures);
        this.objects = Object.fromEntries(this.project.objects.toReversed().map(({ id , selectedPictureId , scene , entity , sprite: { pictures , sounds  }  })=>{
            console.log(selectedPictureId);
            const sprite = new EntrySprite(this.textures[selectedPictureId]);
            sprite.textureIds = pictures.map(({ id  })=>id);
            sprite.currentTextureIndex = sprite.textureIds.indexOf("selectedPictureId");
            sprite.anchor.set(0.5);
            sprite.x = entity.x + 240;
            sprite.y = -entity.y + 135;
            sprite.scale = {
                x: entity.scaleX,
                y: entity.scaleY
            };
            this.scenes[scene].addChild(sprite);
            return [
                id,
                sprite
            ];
        }));
        document.body.addEventListener("keydown", (event)=>{
            this.pressedKeys[event.keyCode] = true;
        });
        document.body.addEventListener("keyup", (event)=>{
            this.pressedKeys[event.keyCode] = false;
        });
        console.log("Init");
        // @ts-ignore: Unknown error???
        this.renderer = await autoDetectRenderer({
            width: 480,
            height: 270,
            backgroundColor: "#fff",
            resolution: 4
        });
        parent.appendChild(this.renderer.canvas);
    }
    emit(eventName) {
        this.events[eventName].forEach((f)=>f());
    }
    on(eventName, f) {
        this.events[eventName].push(f);
    }
    start() {
        this.emit("start");
    }
    render() {
        Object.values(this.scenes)[0].x;
        this.renderer.render({
            container: Object.values(this.scenes)[0]
        });
    }
    wait_tick() {
        this.render();
        return new Promise((o)=>{
            requestAnimationFrame(o);
        });
    }
    /* 시작 */ when_run_button_click(f) {
        this.on("start", f);
    }
    /* 흐름 */ wait_second(sec) {
        this.render();
        return new Promise((o)=>{
            setTimeout(o, sec * 1000);
        });
    }
    async repeat_basic(n, f) {
        let i = 0;
        await this.repeat_inf(async (ctx)=>{
            if (++i > n) {
                ctx.destroy();
                return;
            }
            await f();
        });
    }
    async repeat_inf(f) {
        let breaker = false;
        while(true){
            await f({
                destroy: ()=>{
                    breaker = true;
                }
            });
            if (breaker) break;
            await this.wait_tick();
        }
    }
    async _if(state, f) {
        if (state) await f();
    }
    async if_else(state, o, x) {
        if (state) await o();
        else await x();
    }
    /* 움직임 */ move_x(n, id) {
        this.objects[id].x += n;
    }
    move_y(n, id) {
        this.objects[id].y -= n;
    }
    locate_x(x, id) {
        this.objects[id].x = x + 240;
    }
    locate_y(y, id) {
        this.objects[id].y = -y + 135;
    }
    locate_xy(x, y, id) {
        this.locate_x(x, id);
        this.locate_y(y, id);
    }
    /* 생김새 */ dialog(text, type, objId) {
        console.log(`Object_${objId} ${type}s:`, text);
    }
    change_to_next_shape(type, id) {
        const obj = this.objects[id];
        if (type == "next") {
            obj.currentTextureIndex += 1;
        }
        if (type == "prev") {
            obj.currentTextureIndex -= 1;
        }
        obj.currentTextureIndex = mod(obj.currentTextureIndex, obj.textureIds.length);
        obj.texture = this.textures[obj.textureIds[obj.currentTextureIndex]];
    }
    add_effect_amount(type, amount, id) {
        if (type == "transparency") this.objects[id].alpha += amount / 100;
        else throw new Error(`add_effect_amount - ${type} is not implemented yet.`);
    }
    change_effect_amount(type, amount, id) {
        if (type == "transparency") this.objects[id].alpha = amount / 100;
        else throw new Error(`add_effect_amount - ${type} is not implemented yet.`);
    }
    change_scale_size(d, id) {
        this.objects[id].size += d;
    }
    set_scale_size(newSize, id) {
        this.objects[id].size = newSize;
    }
    /* 판단 */ is_press_some_key(keyCode) {
        return !!this.pressedKeys[Number(keyCode)];
    }
    boolean_basic_operator(a, op, b) {
        if (op == "EQUAL") return a == b;
        if (op == "NOT_EQUAL") return a != b;
        if (op == "GREATER") return a > b;
        if (op == "LESS") return a < b;
        if (op == "GREATER_OR_EQUAL") return a >= b;
        if (op == "LESS_OR_EQUAL") return a <= b;
    }
    /* 계산 */ calc_basic(a, op, b) {
        a = Number(a);
        b = Number(b);
        if (op == "PLUS") return a + b;
        if (op == "MINUS") return a - b;
        if (op == "MULTI") return a * b;
        if (op == "DIVIDE") return a / b;
        throw "nope!";
    }
    calc_rand(a, b) {
        return Math.random() * (b - a) + a;
    }
    calc_operation(n, op) {
        switch(op){
            case "square":
                return n * n;
            case "root":
                return Math.sqrt(n);
            case "log":
                return Math.log(n) / Math.LN10;
            case "ln":
                return Math.log(n);
            case "sin":
            case "cos":
            case "tan":
                return Math[op](toRadian(n));
            case "asin":
            case "acos":
            case "atan":
                return toDegrees(Math[op](n));
            case "unnatural":
                return n % 1;
            case "factorial":
                throw "Unimplemented: factorial";
            default:
                return Math[op](n);
        }
    }
    get_project_timer_value() {
        return this.timer.time / 1000;
    }
    choose_project_timer_action(action) {
        if (action == "START") this.timer.start();
        if (action == "STOP") this.timer.stop();
        if (action == "RESET") this.timer.reset();
    }
    /* 자료 */ get_variable(id) {
        return this.variables[id];
    }
    change_variable(id, value) {
        // @ts-ignore: lol
        this.variables[id] += Number(value);
    }
    set_variable(id, value) {
        this.variables[id] = value;
    }
}
