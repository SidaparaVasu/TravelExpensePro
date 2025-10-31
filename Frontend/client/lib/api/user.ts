import { apiRequest } from "./api";


export async function getUser(id: string) {
    return await apiRequest(
        `/user-management/users/${id}/`,
        "GET",
    )
}

