"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "email" | "date" | "number" | "password"
  error?: string
  required?: boolean
  disabled?: boolean
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  required,
  disabled,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-[5px]">
      <span className="font-sans text-xs font-medium leading-normal text-muted-foreground">
        {label}
        {required ? <span className="text-foreground"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        disabled={disabled}
        className={cn(
          "h-10 w-full rounded-lg border bg-card px-3 py-2.5 font-sans text-[13.5px] leading-normal text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
          error
            ? "border-destructive focus:border-destructive"
            : "border-border focus:border-primary",
        )}
      />
      {error ? (
        <span className="font-sans text-[11px] text-destructive">{error}</span>
      ) : null}
    </label>
  )
}

type SelectFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  required?: boolean
  disabled?: boolean
  error?: string
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
  error,
}: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-[5px]">
      <span className="font-sans text-xs font-medium leading-normal text-muted-foreground">
        {label}
        {required ? <span className="text-foreground"> *</span> : null}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={cn(
          "h-10 w-full rounded-lg border bg-card px-3 py-2.5 font-sans text-[13.5px] leading-normal text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-destructive" : "border-border",
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="font-sans text-[11px] text-destructive">{error}</span>
      ) : null}
    </label>
  )
}

type TextAreaProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: TextAreaProps) {
  return (
    <label className="flex flex-col gap-[5px]">
      <span className="font-sans text-xs font-medium leading-normal text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-border bg-card px-3 py-2.5 font-sans text-[13.5px] leading-normal text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    </label>
  )
}

export type FormErrors<T extends Record<string, unknown>> = Partial<
  Record<keyof T, string>
>

export function useForm<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = React.useState<T>(initial)
  const [errors, setErrors] = React.useState<FormErrors<T>>({})
  const setValue = React.useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((v) => ({ ...v, [key]: value }))
      setErrors((e) => ({ ...e, [key]: undefined }))
    },
    [],
  )
  const reset = React.useCallback(
    (next?: T) => {
      setValues(next ?? initial)
      setErrors({})
    },
    [initial],
  )
  return { values, errors, setValue, setErrors, reset }
}
