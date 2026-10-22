import { api, cleanParams, unwrap, unwrapPage } from "./axios"

export const financeApi = {
  categories: (params) => api.get("/finance/categories", { params: cleanParams(params) }).then(unwrap),
  createCategory: (body) => api.post("/finance/categories", body).then(unwrap),
  updateCategory: (id, body) => api.patch(`/finance/categories/${id}`, body).then(unwrap),

  transactions: (params) => api.get("/finance/transactions", { params: cleanParams(params) }).then(unwrapPage),
  transaction: (id) => api.get(`/finance/transactions/${id}`).then(unwrap),
  createTransaction: (body) => api.post("/finance/transactions", body).then(unwrap),
  updateTransaction: (id, body) => api.patch(`/finance/transactions/${id}`, body).then(unwrap),
  deleteTransaction: (id) => api.delete(`/finance/transactions/${id}`).then(unwrap),

  addPayment: (id, body) => api.post(`/finance/transactions/${id}/payments`, body).then(unwrap),
  reversePayment: (id, paymentId, body) => api.post(`/finance/transactions/${id}/payments/${paymentId}/reverse`, body).then(unwrap),

  summary: (params) => api.get("/finance/summary", { params: cleanParams(params) }).then(unwrap),
  expensesByCategory: (params) => api.get("/finance/expenses-by-category", { params: cleanParams(params) }).then(unwrap),

  /** Downloads the ledger CSV for the current filters. */
  async exportCsv(params) {
    const res = await api.get("/finance/transactions/export", { params: cleanParams(params), responseType: "blob" })
    const match = /filename="([^"]+)"/.exec(res.headers["content-disposition"] || "")
    const url = URL.createObjectURL(res.data)
    const a = document.createElement("a")
    a.href = url
    a.download = match?.[1] || "so-thu-chi.csv"
    a.click()
    URL.revokeObjectURL(url)
  },
}
