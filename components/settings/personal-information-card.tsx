"use client"

import * as React from "react"
import { notify } from "@/lib/toast"
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

export function PersonalInformationCard({
  personal,
  onChange,
}: {
  personal: PersonalInfo
  onChange: (field: string, value: string) => void
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
    if (file) {
      notify.success("Photo uploaded", `"${file.name}" has been uploaded.`)
    }
    // reset so re-selecting the same file triggers onChange again
    e.target.value = ""
  }

  return (
    <div className="flex flex-col gap-5 rounded-[14px] border border-[#e8ebe6] bg-white p-6">
      <h2 className="font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
        Personal information
      </h2>
      <div className="flex h-fit items-center gap-3.5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-[#c8e5de] bg-[#edf6f3]">
          <span className="font-sans text-lg font-semibold leading-normal text-[#2f6f61]">
            {initials}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center rounded-lg border border-[#c8e5de] bg-white px-3 py-[7px]"
          >
            <span className="font-sans text-[12.5px] font-medium leading-normal text-[#2f6f61]">
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex items-center px-3 py-[7px]"
              >
                <span className="font-sans text-[12.5px] leading-normal text-[#8a948d]">
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
                <AlertDialogAction
                  onClick={() => notify.info("Photo removed", "Your profile photo has been removed.")}
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="flex h-fit gap-3.5">
        <Field label="Full name" value={personal.fullName} field="fullName" onChange={onChange} />
        <Field label="Email" value={personal.email} field="email" onChange={onChange} />
      </div>
      <div className="flex h-fit gap-3.5">
        <Field label="Job title" value={personal.jobTitle} field="jobTitle" onChange={onChange} />
        <Field label="Department" value={personal.department} field="department" onChange={onChange} />
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
      <span className="font-sans inline-block text-xs font-medium leading-normal text-[#8a948d]">
        {label}
      </span>
      <div className="flex h-10 items-center rounded-[10px] border border-[#e8ebe6] bg-white px-3 py-2.5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full bg-transparent font-sans text-[13.5px] leading-normal text-[#1f2a26] outline-none"
        />
      </div>
    </div>
  )
}
