import { useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function PasswordInput({ id, invalid, icon: Icon, className, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative flex w-full items-center">
      {Icon && (
        <span className="pointer-events-none absolute left-3.5 z-10 flex items-center text-muted-foreground">
          <Icon className="size-4" />
        </span>
      )}
      <Input
        id={id}
        type={visible ? "text" : "password"}
        aria-invalid={invalid}
        className={cn(Icon && "pl-10", "pr-10", className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute right-2.5 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  )
}
