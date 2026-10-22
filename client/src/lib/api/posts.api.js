import { api, cleanParams, unwrap, unwrapPage } from "./axios"

export const postsApi = {
  list: (params) => api.get("/posts", { params: cleanParams(params) }).then(unwrapPage),
  get: (id) => api.get(`/posts/${id}`).then(unwrap),
  create: (body) => api.post("/posts", body).then(unwrap),
  update: (id, body) => api.patch(`/posts/${id}`, body).then(unwrap),
  remove: (id) => api.delete(`/posts/${id}`).then(unwrap),
  metrics: (id) => api.get(`/posts/${id}/metrics`).then(unwrap),
  addMetric: (id, body) => api.post(`/posts/${id}/metrics`, body).then(unwrap),
  calendar: (params) => api.get("/calendar", { params: cleanParams(params) }).then(unwrap),
}

export const channelsApi = {
  list: (params) => api.get("/channels", { params: cleanParams(params) }).then(unwrap),
  create: (body) => api.post("/channels", body).then(unwrap),
  update: (id, body) => api.patch(`/channels/${id}`, body).then(unwrap),
  remove: (id) => api.delete(`/channels/${id}`).then(unwrap),
}
