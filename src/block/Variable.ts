import { Module } from "../Module.ts"
import { EntryContainer } from "../obj/mod.ts"

export class Variable extends Module {
    variables = new Map<string, string | number | (string | number)[]>
    variablesMeta = new Map<string, { object: string | null }>

    // deno-lint-ignore require-await
    override async init() {
        this.project.variables.forEach(
            ({id, value, array, variableType, object}) => {
                this.variablesMeta.set(id, { object })

                const v = variableType == "list"
                    ? array?.map(({data}) => data)
                    : value

                if (object == null) {
                    this.variables.set(id, v)
                } else {
                    this.objects[object].variables.set(id, v)
                }
            }
        )
    }

    _get(id: string, obj: EntryContainer) {
        return this.variablesMeta.get(id)!.object
            ? obj.variables.get(id)
            : this.variables.get(id)
    }
    _set(
        id: string,
        value: string | number | (string | number)[],
        obj: EntryContainer,
    ) {
        this.variablesMeta.get(id)!.object
            ? obj.variables.set(id, value)
            : this.variables.set(id, value)
    }
    
    get_variable(id: string, obj: EntryContainer) {
        return this._get(id, obj)
    }
    change_variable(id: string, value: number, obj: EntryContainer) {
        this._set(id, Number(this._get(id, obj)) + Number(value), obj)
    }
    set_variable(id: string, value: string | number, obj: EntryContainer) {
        this._set(id, value, obj)
    }
    show_variable() {
        console.log("skip:", "show_variable")
    }
    hide_variable() {
        console.log("skip:", "hide_variable")
    }
    value_of_index_from_list(id: string, i: number, obj: EntryContainer) {
        if (!Array.isArray(this._get(id, obj))) {
            throw new Error(`${id} is not array`)
        }
        return (this._get(id, obj) as (string | number)[])[i - 1]
    }
    add_value_to_list(value: string | number, id: string, obj: EntryContainer) {
        if (!Array.isArray(this._get(id, obj))) {
            throw new Error(`${id} is not array`)
        }
        return (this._get(id, obj) as (string | number)[]).push(value)
    }
    remove_value_from_list(i: number, id: string, obj: EntryContainer) {
        if (!Array.isArray(this._get(id, obj))) {
            throw new Error(`${id} is not array`)
        }
        (this._get(id, obj) as (string | number)[]).splice(i - 1, 1)
    }
    insert_value_to_list(
        value: string | number,
        id: string,
        i: number,
        obj: EntryContainer,
    ) {
        if (!Array.isArray(this._get(id, obj))) {
            throw new Error(`${id} is not array`)
        }
        (this._get(id, obj) as (string | number)[]).splice(i - 1, 0, value)
    }
    change_value_list_index(
        id: string,
        i: number,
        value: string | number,
        obj: EntryContainer,
    ) {
        if (!Array.isArray(this._get(id, obj))) {
            throw new Error(`${id} is not array`)
        }
        (this._get(id, obj) as (string | number)[])[i - 1] = value
    }
    length_of_list(id: string, obj: EntryContainer) {
        if (!Array.isArray(this._get(id, obj))) {
            throw new Error(`${id} is not array`)
        }
        return (this._get(id, obj) as (string | number)[]).length
    }
    is_included_in_list(
        id: string,
        value: string | number,
        obj: EntryContainer,
    ) {
        if (!Array.isArray(this._get(id, obj))) {
            throw new Error(`${id} is not array`)
        }
        return (this._get(id, obj) as (string | number)[]).includes(value)
    }
    show_list() {
        console.log("skip:", "show_list")
    }
    hide_list() {
        console.log("skip:", "hide_list")
    }
}
