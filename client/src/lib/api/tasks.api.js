import { api, cleanParams, unwrap, unwrapPage } from "./axios"

export const tasksApi = {
  list: (params) => api.get("/tasks", { params: cleanParams(params) }).then(unwrapPage),
  get: (id) => api.get(`/tasks/${id}`).then(unwrap),
  create: (body) => api.post("/tasks", body).then(unwrap),
  update: (id, body) => api.patch(`/tasks/${id}`, body).then(unwrap),
  remove: (id) => api.delete(`/tasks/${id}`).then(unwrap),
  assignments: (id) => api.get(`/tasks/${id}/assignments`).then(unwrap),
  assign: (id, body) => api.post(`/tasks/${id}/assignments`, body).then(unwrap),
  updateAssignment: (id, userId, body) => api.patch(`/tasks/${id}/assignments/${userId}`, body).then(unwrap),
  unassign: (id, userId) => api.delete(`/tasks/${id}/assignments/${userId}`).then(unwrap),
}
