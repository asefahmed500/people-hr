export type PersonalInfo = {
  fullName: string
  email: string
  jobTitle: string
  department: string
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

export const defaultSettingsStore: SettingsStore = {
  personal: {
    fullName: "Asef Ahmed",
    email: "asef.ahmed@northwind.co",
    jobTitle: "People Operations Lead",
    department: "People",
  },
  preferences: {
    emailDigest: true,
    desktopNotifications: true,
    weeklyReport: false,
    twoFactor: true,
  },
}
