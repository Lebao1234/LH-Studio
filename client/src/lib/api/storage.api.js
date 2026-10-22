import axios from "axios"
import { api, unwrap } from "./axios"

export const storageApi = {
  getStatus: () => api.get("/storage/status").then(unwrap),

  getPresignedUrl: (data) => api.post("/storage/presigned-url", data).then(unwrap),

  /**
   * Uploads a file seamlessly to Cloudinary, Cloudflare R2, or Local Storage.
   *
   * @param {File} file - The file object from <input type="file">
   * @param {Object} options - { folder: 'covers' | 'videos' | 'avatars', onProgress: (percent) => void }
   * @returns {Promise<{ fileUrl: string, key: string, provider: string }>}
   */
  async uploadFile(file, { folder = "general", onProgress } = {}) {
    // 1. Get upload configuration from backend
    const presigned = await storageApi.getPresignedUrl({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      folder,
    })

    const config = presigned?.data || presigned || {}
    const { provider, uploadUrl, fileUrl, key, method, headers, fields } = config

    // ─── CLOUDINARY DIRECT UPLOAD ──────────────────────────────────────────
    if (provider === "cloudinary") {
      try {
        const formData = new FormData()
        formData.append("file", file)
        if (fields) {
          for (const [k, v] of Object.entries(fields)) {
            formData.append(k, v)
          }
        }

        const res = await axios.post(uploadUrl, formData, {
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              onProgress(percent)
            }
          },
        })

        return {
          fileUrl: res.data.secure_url,
          key: res.data.public_id,
          duration: res.data.duration,
          provider: "cloudinary",
        }
      } catch (cloudErr) {
        console.warn("Direct Cloudinary upload failed, falling back to server relay...", cloudErr)
        // Fallback to server relay upload below
      }
    }

    // ─── CLOUDFLARE R2 DIRECT PUT UPLOAD ───────────────────────────────────
    if (provider === "cloudflare_r2" && method === "PUT") {
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          ...headers,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(percent)
          }
        },
      })

      return { fileUrl, key, provider }
    }

    // ─── SERVER RELAY / LOCAL DRIVER UPLOAD ─────────────────────────────────
    const formData = new FormData()
    formData.append("file", file)

    const relayUrl = `/storage/upload?folder=${encodeURIComponent(folder)}`
    const res = await api.post(relayUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })

    return {
      fileUrl: res.data?.data?.fileUrl || fileUrl,
      key: res.data?.data?.key || key,
      provider: res.data?.data?.provider || "local_storage",
    }
  },
}
