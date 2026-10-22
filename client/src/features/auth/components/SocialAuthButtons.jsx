import { toast } from "sonner"
import { Button } from "@/components/ui/button"

function AppleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5" {...props}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76.99.08 2.03-.51 2.68-1.26z" />
    </svg>
  )
}

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

function MetaIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5" {...props}>
      <path d="M12 6.5c-2.4 0-4.3 1.5-5.3 3.4-.9-1.9-2.8-3.4-5.2-3.4C-.1 6.5-.4 10.8 1.4 13.9c1.5 2.6 4.1 3.6 6.3 3.6 2.4 0 4.3-1.5 5.3-3.4.9 1.9 2.8 3.4 5.2 3.4 1.6 0 4.2-1 5.7-3.6 1.8-3.1 1.5-7.4-.1-7.4-2.4 0-4.3 1.5-5.3 3.4-.9-1.9-2.8-3.4-5.2-3.4zm-4.3 8.4c-1.3 0-2.8-.7-3.7-2.3-1-1.7-.8-4.2.2-4.2 1.3 0 2.8.7 3.7 2.3 1 1.7.8 4.2-.2 4.2zm8.6 0c-1 0-1.2-2.5-.2-4.2.9-1.6 2.4-2.3 3.7-2.3 1 0 1.2 2.5.2 4.2-.9 1.6-2.4 2.3-3.7 2.3z" />
    </svg>
  )
}

export function SocialAuthButtons() {
  const handleClick = (provider) => {
    toast.info(`Tính năng đăng nhập bằng ${provider} đang được kết nối.`)
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full rounded-xl border-border/80 hover:bg-muted/60 transition-colors"
        onClick={() => handleClick("Apple")}
        aria-label="Đăng nhập bằng Apple"
      >
        <AppleIcon />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full rounded-xl border-border/80 hover:bg-muted/60 transition-colors"
        onClick={() => handleClick("Google")}
        aria-label="Đăng nhập bằng Google"
      >
        <GoogleIcon />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full rounded-xl border-border/80 hover:bg-muted/60 transition-colors"
        onClick={() => handleClick("Meta")}
        aria-label="Đăng nhập bằng Meta"
      >
        <MetaIcon />
      </Button>
    </div>
  )
}

