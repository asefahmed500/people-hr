"use client"

import * as React from "react"
import type { PersonalInfo } from "@/lib/data"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { notify } from "@/lib/toast"

export function PersonalInformationCard({
  personal,
  onChange,
  canEditDepartment = false,
}: {
  personal: PersonalInfo
  onChange: (field: string, value: string) => void
  /** Department drives manager data-scoping — only admins may change it. */
  canEditDepartment?: boolean
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const initials = personal.fullName
    ? personal.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AA"

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 300 * 1024) {
      notify.error("Image too large", "Pick an image under 300 KB.")
      e.target.value = ""
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange("avatar", reader.result)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
        Personal information
      </h2>
      <div className="flex h-fit items-center gap-3.5">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
          {personal.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={personal.avatar} alt="" className="size-full object-cover" />
          ) : (
            <span className="font-sans text-lg font-semibold leading-normal text-primary">
              {initials}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center rounded-lg border border-border bg-card px-3 py-[7px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="font-sans text-[12.5px] font-medium leading-normal text-primary">
              Change photo
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          {personal.avatar ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="flex items-center px-3 py-[7px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="font-sans text-[12.5px] leading-normal text-muted-foreground">
                    Remove
                  </span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove photo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove your profile photo?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onChange("avatar", "")}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>
      <div className="flex h-fit gap-3.5">
        <Field label="Full name" value={personal.fullName} field="fullName" onChange={onChange} />
        <Field label="Email" value={personal.email} field="email" onChange={onChange} />
      </div>
      <div className="flex h-fit gap-3.5">
        <Field label="Job title" value={personal.jobTitle} field="jobTitle" onChange={onChange} />
        {canEditDepartment ? (
          <Field
            label="Department"
            value={personal.department}
            field="department"
            onChange={onChange}
          />
        ) : (
          <div className="flex flex-1 flex-col gap-[5px]">
            <span className="font-sans inline-block text-xs font-medium leading-normal text-muted-foreground">
              Department
            </span>
            <div className="flex h-10 items-center rounded-lg border border-border bg-muted px-3 py-2.5">
              <span className="w-full truncate font-sans text-[13.5px] leading-normal text-muted-foreground">
                {personal.department || "—"}
              </span>
            </div>
            <span className="font-sans text-[11px] leading-normal text-muted-foreground">
              Only admins can change your department.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  field,
  onChange,
}: {
  label: string
  value: string
  field: string
  onChange: (field: string, value: string) => void
}) {
  return (
    <div className="flex flex-1 flex-col gap-[5px]">
      <span className="font-sans inline-block text-xs font-medium leading-normal text-muted-foreground">
        {label}
      </span>
      <div className="flex h-10 items-center rounded-lg border border-border bg-card px-3 py-2.5 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-foreground/20">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full bg-transparent font-sans text-[13.5px] leading-normal text-foreground outline-none"
        />
      </div>
    </div>
  )
}
