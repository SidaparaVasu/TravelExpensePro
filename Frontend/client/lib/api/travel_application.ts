import { apiRequest } from "./api";


export async function approvalApplicationList(token: string | null) {
    return await apiRequest(
        // `/travel-applications/manager/approval/`,
        `/travel/my-applications/`,
        // `/travel/applications/`,
        "GET",
        null,
        token
    )
}


export async function approveTravelApplication(id: string, token: string) { // token: string
  return await apiRequest(
    `/travel-applications/${id}/manager/action/`,
    "POST",
    { action: "approve" },
    token
  );
}

export async function rejectTravelApplication(id: string, token: string) { // token: string
  return await apiRequest(
    `/travel-applications/${id}/manager/action/`,
    "POST",
    { action: "reject" },
    token
  );
}

