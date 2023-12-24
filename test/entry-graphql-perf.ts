import { entryApi } from "../util/entryApi.ts"

const id = "6583e2f7ae29db004afa2b2f"

await entryApi({})

await Promise.all([
    (async () => {
        console.time("query all")
        await entryApi({
            query: `
                query SELECT_PROJECT($id: ID! $groupId: ID) {
                    project(id: $id, groupId: $groupId) {
                        id
                        updated
                        name
                        thumb
                        objects
                        variables
                        cloudVariable
                        messages
                        functions
                        tables
                        scenes
                    }
                }
            `,
            variables: {
                id,
            }
        }).then(x => x.json())
        console.timeEnd("query all")
    })(),
    (async () => {
        console.time("query updated")
        await entryApi({
            query: `
                query SELECT_PROJECT($id: ID! $groupId: ID) {
                    project(id: $id, groupId: $groupId) {
                        updated
                    }
                }
            `,
            variables: {
                id,
            }
        }).then(x => x.json())
        console.timeEnd("query updated")
    })(),
])