import { api, cleanParams, unwrap } from "./axios"

export const studioApi = {
  current: () => api.get("/studios/current").then(unwrap),
  update: (body) => api.patch("/studios/current", body).then(unwrap),
  members: (params) => api.get("/studios/current/members", { params: cleanParams(params) }).then(unwrap),
  addMember: (body) => api.post("/studios/current/members", body).then(unwrap),
  updateMember: (id, body) => api.patch(`/studios/current/members/${id}`, body).then(unwrap),
  removeMember: (id) => api.delete(`/studios/current/members/${id}`).then(unwrap),
  invitations: () => api.get("/studios/current/invitations").then(unwrap),
  revokeInvitation: (id) => api.delete(`/studios/current/invitations/${id}`).then(unwrap),
}

export const dashboardApi = {
  overview: () => api.get("/dashboard/overview").then(unwrap),
  projectStatus: () => api.get("/dashboard/project-status").then(unwrap),
  tasksSummary: () => api.get("/dashboard/tasks-summary").then(unwrap),
  upcomingPosts: () => api.get("/dashboard/upcoming-posts").then(unwrap),
  financialSummary: () => api.get("/dashboard/financial-summary").then(unwrap),
}
