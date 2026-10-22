import { api, cleanParams, unwrap, unwrapPage } from "./axios"

export const projectsApi = {
  list: (params) => api.get("/projects", { params: cleanParams(params) }).then(unwrapPage),
  nextCode: (category) => api.get("/projects/next-code", { params: { category } }).then(unwrap),
  get: (id) => api.get(`/projects/${id}`).then(unwrap),
  create: (body) => api.post("/projects", body).then(unwrap),
  update: (id, body) => api.patch(`/projects/${id}`, body).then(unwrap),
  remove: (id) => api.delete(`/projects/${id}`).then(unwrap),
  members: (id) => api.get(`/projects/${id}/members`).then(unwrap),
  addMember: (id, body) => api.post(`/projects/${id}/members`, body).then(unwrap),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`).then(unwrap),
}

export const episodesApi = {
  list: (projectId, params) => api.get(`/projects/${projectId}/episodes`, { params: cleanParams(params) }).then(unwrapPage),
  get: (id) => api.get(`/episodes/${id}`).then(unwrap),
  create: (projectId, body) => api.post(`/projects/${projectId}/episodes`, body).then(unwrap),
  update: (id, body) => api.patch(`/episodes/${id}`, body).then(unwrap),
  remove: (id) => api.delete(`/episodes/${id}`).then(unwrap),
}
