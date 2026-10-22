import { useState, useRef } from "react"
import {
  CheckCircle2Icon,
  FilmIcon,
  ImageIcon,
  LinkIcon,
  Trash2Icon,
  UploadCloudIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { storageApi } from "@/lib/api/storage.api"
import { cn } from "@/lib/utils"

export function FileUpload({
  value,
  onChange,
  type = "image", // "image" | "video" | "file"
  folder = "general",
  label,
  hint,
  maxSizeMB = type === "video" ? 1000 : 15,
  className,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInputValue, setUrlInputValue] = useState("")
  const inputRef = useRef(null)

  const isVideo = type === "video"
  const acceptTypes = isVideo
    ? "video/mp4,video/webm,video/quicktime,video/x-matroska"
    : "image/jpeg,image/png,image/webp,image/gif,image/svg+xml"

  const handleFile = async (file) => {
    if (!file) return

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Kích thước file vượt quá giới hạn cho phép (${maxSizeMB}MB).`)
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const res = await storageApi.uploadFile(file, {
        folder,
        onProgress: (p) => setProgress(p),
      })

      if (res?.fileUrl) {
        onChange?.(res.fileUrl)
        toast.success(
          res.provider === "cloudflare_r2"
            ? "Đã tải lên Cloudflare R2 thành công!"
            : "Đã tải file lên máy chủ thành công!"
        )
      }
    } catch (err) {
      console.error("Upload error:", err)
      toast.error(err.response?.data?.message || "Tải file thất bại. Vui lòng thử lại.")
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleApplyUrl = () => {
    if (urlInputValue.trim()) {
      onChange?.(urlInputValue.trim())
      setShowUrlInput(false)
      setUrlInputValue("")
    }
  }

  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between">
        {label && <label className="text-xs font-medium text-foreground">{label}</label>}
        <div className="flex items-center gap-1.5">
          {!uploading && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
              onClick={() => setShowUrlInput((p) => !p)}
            >
              <LinkIcon className="size-3" />
              <span>{showUrlInput ? "Ẩn dán URL" : "Dán URL trực tiếp"}</span>
            </Button>
          )}
        </div>
      </div>

      {showUrlInput && (
        <div className="flex items-center gap-2 mb-1 p-2 rounded-lg border border-border/80 bg-muted/40">
          <input
            type="url"
            placeholder="https://..."
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            className="flex-1 bg-background text-xs px-2.5 py-1.5 rounded border border-input focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button type="button" size="xs" onClick={handleApplyUrl}>
            Áp dụng
          </Button>
        </div>
      )}

      {/* Uploading State */}
      {uploading && (
        <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-primary/50 bg-primary/5 text-center">
          <UploadCloudIcon className="size-8 text-primary animate-bounce mb-2" />
          <p className="text-xs font-semibold text-foreground">Đang tải {isVideo ? "video" : "ảnh"} lên Cloud...</p>
          <div className="w-full max-w-xs mt-3 flex items-center gap-2">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs font-mono font-medium text-primary w-10 text-right">{progress}%</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Vui lòng không đóng cửa sổ trong lúc tải.
          </p>
        </div>
      )}

      {/* Has Value State */}
      {!uploading && value && (
        <div className="relative rounded-xl border border-border/80 bg-card p-2.5 overflow-hidden group">
          {isVideo ? (
            <div className="grid gap-2">
              <video
                src={value}
                controls
                preload="metadata"
                className="w-full max-h-56 rounded-lg bg-black object-contain"
              />
              <div className="flex items-center justify-between px-1">
                <span className="truncate text-[11px] font-mono text-muted-foreground max-w-[280px]">
                  {value}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="h-7 text-xs"
                    onClick={() => inputRef.current?.click()}
                  >
                    Đổi video
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-7 text-destructive hover:bg-destructive/10"
                    onClick={() => onChange?.("")}
                    title="Xóa video"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative size-16 shrink-0 rounded-lg overflow-hidden border border-border/80 bg-muted/40">
                <img
                  src={value}
                  alt="Cover preview"
                  className="size-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2Icon className="size-3.5 shrink-0" />
                  <span>Đã tải lên</span>
                </div>
                <p className="truncate text-[11px] font-mono text-muted-foreground mt-0.5 max-w-xs">
                  {value}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="h-7 text-xs"
                  onClick={() => inputRef.current?.click()}
                >
                  Đổi ảnh
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-7 text-destructive hover:bg-destructive/10"
                  onClick={() => onChange?.("")}
                  title="Xóa ảnh"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty / Drag & Drop Zone */}
      {!uploading && !value && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center p-5 rounded-xl border border-dashed text-center cursor-pointer transition-all",
            isDragging
              ? "border-primary bg-primary/10 scale-[0.99]"
              : "border-border/80 hover:border-primary/50 hover:bg-muted/40 bg-muted/20"
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            {isVideo ? <FilmIcon className="size-5" /> : <ImageIcon className="size-5" />}
          </div>
          <p className="text-xs font-semibold text-foreground">
            Nhấn để chọn {isVideo ? "video" : "ảnh"} hoặc kéo thả vào đây
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {isVideo
              ? `Hỗ trợ MP4, WebM, QuickTime (tối đa ${maxSizeMB}MB)`
              : `Hỗ trợ JPG, PNG, WebP (tối đa ${maxSizeMB}MB)`}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />

      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

