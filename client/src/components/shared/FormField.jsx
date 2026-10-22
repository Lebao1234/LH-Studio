import { useId } from "react"
import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { SimpleSelect } from "./SimpleSelect"
import { groupDigits } from "@/lib/utils/format"

/** Label + control + inline error. `children(id)` renders the control. */
export function Field({ label, error, hint, required, className, children }) {
  const id = useId()
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && (
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children(id)}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

const errorOf = (form, name) => name.split(".").reduce((acc, k) => acc?.[k], form.formState.errors)?.message

export function TextField({ form, name, label, required, hint, className, ...inputProps }) {
  const error = errorOf(form, name)
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className}>
      {(id) => <Input id={id} aria-invalid={Boolean(error)} {...form.register(name)} {...inputProps} />}
    </Field>
  )
}

export function TextareaField({ form, name, label, required, hint, className, ...props }) {
  const error = errorOf(form, name)
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className}>
      {(id) => <Textarea id={id} aria-invalid={Boolean(error)} {...form.register(name)} {...props} />}
    </Field>
  )
}

export function SelectField({ form, name, label, required, hint, options, placeholder, allLabel, className, disabled, onChange }) {
  const error = errorOf(form, name)
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className}>
      {(id) => (
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <SimpleSelect
              id={id}
              value={field.value}
              onChange={(val) => {
                field.onChange(val)
                onChange?.(val)
              }}
              options={options}
              placeholder={placeholder}
              allLabel={allLabel}
              disabled={disabled}
              aria-invalid={Boolean(error)}
            />
          )}
        />
      )}
    </Field>
  )
}

/** VND input: shows "50.000.000", stores the digit string "50000000". */
export function MoneyField({ form, name, label, required, hint, className, disabled }) {
  const error = errorOf(form, name)
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className}>
      {(id) => (
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <div className="relative">
              <Input
                id={id}
                inputMode="numeric"
                autoComplete="off"
                disabled={disabled}
                aria-invalid={Boolean(error)}
                className="tabular pr-8"
                value={field.value ? groupDigits(field.value) : ""}
                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 16))}
                onBlur={field.onBlur}
              />
              <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">₫</span>
            </div>
          )}
        />
      )}
    </Field>
  )
}
