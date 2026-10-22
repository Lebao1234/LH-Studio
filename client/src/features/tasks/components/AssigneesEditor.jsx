import { Controller, useFieldArray, useWatch } from "react-hook-form"
import { PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SimpleSelect } from "@/components/shared/SimpleSelect"
import { options as labelOptions } from "@/lib/constants/labels"

/** Assignees for a NEW task, edited inside the form as `assignees: [{ userId, role }]`. */
export function AssigneesEditor({ form, assigneeOptions, loading }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "assignees" })
  const values = useWatch({ control: form.control, name: "assignees" }) ?? []
  const err = form.formState.errors.assignees
  const arrayError = err?.message ?? err?.root?.message
  const hasLead = values.some((a) => a.role === "lead")

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Người thực hiện</Label>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={loading || values.length >= assigneeOptions.length}
          onClick={() => append({ userId: "", role: hasLead ? "contributor" : "lead" })}
        >
          <PlusIcon /> Thêm người
        </Button>
      </div>
      {fields.length === 0 && <p className="text-xs text-muted-foreground">Chưa giao cho ai.</p>}
      {fields.map((field, index) => {
        const taken = new Set(values.filter((_, i) => i !== index).map((a) => a.userId))
        const rowOptions = assigneeOptions.filter((o) => !taken.has(o.value))
        const rowError = err?.[index]?.userId?.message
        return (
          <div key={field.id} className="grid gap-1">
            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name={`assignees.${index}.userId`}
                render={({ field: f }) => (
                  <SimpleSelect
                    aria-label={`Người thực hiện ${index + 1}`}
                    size="sm"
                    className="flex-1"
                    value={f.value}
                    onChange={f.onChange}
                    options={rowOptions}
                    placeholder={loading ? "Đang tải..." : "Chọn người"}
                    aria-invalid={Boolean(rowError)}
                  />
                )}
              />
              <Controller
                control={form.control}
                name={`assignees.${index}.role`}
                render={({ field: f }) => (
                  <SimpleSelect
                    aria-label={`Vai trò người thực hiện ${index + 1}`}
                    size="sm"
                    className="w-36 shrink-0"
                    value={f.value}
                    onChange={f.onChange}
                    options={labelOptions.assignmentRoles}
                  />
                )}
              />
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Bỏ người này" onClick={() => remove(index)}>
                <XIcon />
              </Button>
            </div>
            {rowError && <p className="text-xs text-destructive">{rowError}</p>}
          </div>
        )
      })}
      {arrayError && (
        <p role="alert" className="text-xs text-destructive">
          {arrayError}
        </p>
      )}
    </div>
  )
}
