"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "email" | "date" | "number"
  error?: string
  required?: boolean
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  required,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-[5px]">
      <span className="font-sans text-xs font-medium leading-normal text-[#8a948d]">
        {label}
        {required ? <span className="text-[#c4553a]"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={cn(
          "h-10 w-full rounded-[10px] border bg-white px-3 py-2.5 font-sans text-[13.5px] leading-normal text-[#1f2a26] outline-none placeholder:text-[#a6aca3]",
          error
            ? "border-[#e76f51] focus:border-[#e76f51]"
            : "border-[#e8ebe6] focus:border-[#2f6f61]",
        )}
      />
      {error ? (
        <span className="font-sans text-[11px] text-[#c4553a]">{error}</span>
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
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-[5px]">
      <span className="font-sans text-xs font-medium leading-normal text-[#8a948d]">
        {label}
        {required ? <span className="text-[#c4553a]"> *</span> : null}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-[10px] border border-[#e8ebe6] bg-white px-3 py-2.5 font-sans text-[13.5px] leading-normal text-[#1f2a26] outline-none focus:border-[#2f6f61]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
      <span className="font-sans text-xs font-medium leading-normal text-[#8a948d]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-[10px] border border-[#e8ebe6] bg-white px-3 py-2.5 font-sans text-[13.5px] leading-normal text-[#1f2a26] outline-none placeholder:text-[#a6aca3] focus:border-[#2f6f61]"
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
