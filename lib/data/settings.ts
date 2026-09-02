export type PersonalInfo = {
  fullName: string
  email: string
  jobTitle: string
  department: string
  avatar?: string
}

export type Preferences = {
  emailDigest: boolean
  desktopNotifications: boolean
  weeklyReport: boolean
  twoFactor: boolean
}

export type SettingsStore = {
  personal: PersonalInfo
  preferences: Preferences
}

// Neutral defaults — real identity fields (fullName, email, department) are
// seeded from the signed-in session by /api/store/[key] on first read, and
// edited through the app afterwards. The placeholder values here must pass the
// settings zod schema (non-empty name, valid email) so a reset of the module
// can never write an invalid document.
export const defaultSettingsStore: SettingsStore = {
  personal: {
    fullName: "Team Member",
    email: "user@example.com",
    jobTitle: "",
    department: "",
  },
  preferences: {
    emailDigest: true,
    desktopNotifications: true,
    weeklyReport: false,
    twoFactor: false,
  },
}
