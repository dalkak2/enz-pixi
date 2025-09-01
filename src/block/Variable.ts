import { Module } from "../Module.ts"

export class Variable extends Module {
    variables: Record<string, string | number | (string | number)[]> = {}

    // deno-lint-ignore require-await
    override async init() {
        this.variables = Object.fromEntries(
            this.project.variables.map(
                ({id, value, array, variableType}) => {
                    return [
                        id,
                        variableType == "list"
                            ? array?.map(({data}) => data)
                            : value,
                    ]
                }
            )
        )
    }

    _get(id: string) {
        return this.variables[id]
    }
    _set(id: string, value: string | number | (string | number)[]) {
        this.variables[id] = value
    }
    
    get_variable(id: string) {
        return this._get(id)
    }
    change_variable(id: string, value: number) {
        this._set(id, Number(this._get(id)) + Number(value))
    }
    set_variable(id: string, value: string | number) {
        this._set(id, value)
    }
    show_variable() {
        console.log("skip:", "show_variable")
    }
    hide_variable() {
        console.log("skip:", "hide_variable")
    }
    value_of_index_from_list(id: string, i: number) {
        if (!Array.isArray(this.variables[id])) {
            throw new Error(`${id} is not array`)
        }
        return (this._get(id) as (string | number)[])[i - 1]
    }
    add_value_to_list(value: string | number, id: string) {
        if (!Array.isArray(this._get(id))) {
            throw new Error(`${id} is not array`)
        }
        return (this._get(id) as (string | number)[]).push(value)
    }
    remove_value_from_list(i: number, id: string) {
        if (!Array.isArray(this._get(id))) {
            throw new Error(`${id} is not array`)
        }
        (this._get(id) as (string | number)[]).splice(i - 1, 1)
    }
    insert_value_to_list(
        value: string | number,
        id: string,
        i: number,
    ) {
        if (!Array.isArray(this._get(id))) {
            throw new Error(`${id} is not array`)
        }
        (this._get(id) as (string | number)[]).splice(i - 1, 0, value)
    }
    change_value_list_index(
        id: string,
        i: number,
        value: string | number,
    ) {
        if (!Array.isArray(this._get(id))) {
            throw new Error(`${id} is not array`)
        }
        (this._get(id) as (string | number)[])[i - 1] = value
    }
    length_of_list(id: string) {
        if (!Array.isArray(this._get(id))) {
            throw new Error(`${id} is not array`)
        }
        return (this._get(id) as (string | number)[]).length
    }
    is_included_in_list(id: string, value: string | number) {
        if (!Array.isArray(this._get(id))) {
            throw new Error(`${id} is not array`)
        }
        return (this._get(id) as (string | number)[]).includes(value)
    }
    show_list() {
        console.log("skip:", "show_list")
    }
    hide_list() {
        console.log("skip:", "hide_list")
    }
}
