import { entryApi } from "../util/entryApi.ts"

const query = `
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
`

export const project = async (id: string) =>
    (
        await entryApi({
            query,
            variables: {
                id,
            }
        }).then(x => x.json())
    ).data.project