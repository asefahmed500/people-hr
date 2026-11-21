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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/toast"
import { apiRequest } from "@/lib/api-client"

const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_AVATAR_BYTES = 300 * 1024

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Couldn't read that image."))
    }
    reader.onerror = () => reject(new Error("Couldn't read that image."))
    reader.readAsDataURL(file)
  })
}

export function PersonalInformationCard({
  personal,
  onChange,
  canEditDepartment = false,
}: {
  personal: PersonalInfo
  onChange: (field: string, value: string) => void
  /** Department drives manager data-scoping â€” only admins may change it. */
  canEditDepartment?: boolean
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const initials = personal.fullName
    ? personal.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AA"

  // Persist straight to the real User record, then mirror into the settings
  // document so the preview stays in sync on the next page load.
  const persistAvatar = async (value: string) => {
    setUploading(true)
    try {
      const res = await apiRequest<{ ok: boolean; error?: string }>("/api/user/profile", {
        method: "PATCH",
        body: { avatar: value },
      })
      if (!res.ok) throw new Error(res.error ?? "Couldn't update your photo.")
      onChange("avatar", value)
      notify.success(value ? "Photo updated" : "Photo removed", "Your profile photo has been updated.")
    } catch (err) {
      notify.error(
        "Couldn't update your photo",
        err instanceof Error ? err.message : "Please try again.",
      )
    } finally {
      setUploading(false)
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      notify.error("Unsupported image", "Choose a PNG, JPEG, or WebP image.")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      notify.error("Image too large", "Pick an image under 300 KB.")
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      await persistAvatar(dataUrl)
    } catch (err) {
      notify.error("Couldn't read image", err instanceof Error ? err.message : "Please try again.")
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <h2 className="font-sans inline-block text-[15px] font-semibold leading-normal text-foreground">
        Personal information
      </h2>
      <div className="flex h-fit items-center gap-3">
        <Avatar className="size-14">
          {personal.avatar ? (
            <AvatarImage src={personal.avatar} alt="" />
          ) : null}
          <AvatarFallback className="text-lg font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Savingâ€¦" : "Change photo"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
          {personal.avatar ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                >
                  Remove
                </Button>
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
                  <AlertDialogAction onClick={() => void persistAvatar("")}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>
      <div className="flex h-fit gap-3">
        <Field label="Full name" value={personal.fullName} field="fullName" onChange={onChange} />
        <Field label="Email" value={personal.email} field="email" onChange={onChange} />
      </div>
      <div className="flex h-fit gap-3">
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
            <div className="flex h-9 items-center rounded-lg border border-border bg-muted px-3 py-2.5">
              <span className="w-full truncate font-sans text-[13.5px] leading-normal text-muted-foreground">
                {personal.department || "â€”"}
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
      <div className="flex h-9 items-center rounded-lg border border-border bg-card px-3 py-2.5 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-foreground/20">
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
