export function SettingsHeader() {
  return (
    <div className="flex h-fit flex-col gap-1">
      <h1 className="font-sans inline-block text-[28px] font-semibold leading-tight text-foreground">
        Settings
      </h1>
      <p className="font-sans inline-block text-[13.5px] leading-normal text-muted-foreground">
        Manage your workspace, profile, and preferences
      </p>
    </div>
  )
}
