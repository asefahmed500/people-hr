"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { LandingCtaBand } from "@/components/landing/landing-cta-band"
import { LandingDashboardShowcase } from "@/components/landing/landing-dashboard-showcase"
import { LandingFeatureGrid } from "@/components/landing/landing-feature-grid"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingLogoStrip } from "@/components/landing/landing-logo-strip"
import { LandingSplitFeature } from "@/components/landing/landing-split-feature"
import { LandingStatsBand } from "@/components/landing/landing-stats-band"
import { LandingTestimonial } from "@/components/landing/landing-testimonial"
import { LandingTopNav } from "@/components/landing/landing-top-nav"
import { Skeleton } from "@/components/ui/skeleton"

export function LandingHomeClient() {
  const router = useRouter()
  const { isAuthenticated, hydrated } = useAuth()

  React.useEffect(() => {
    if (hydrated && isAuthenticated) router.replace("/dashboard")
  }, [hydrated, isAuthenticated, router])

  if (hydrated && isAuthenticated) {
    return (
      <div className="flex min-h-svh w-full flex-col gap-6 bg-background p-6 sm:p-10">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full flex-col bg-background">
      <LandingTopNav />
      <LandingHero />
      <LandingLogoStrip />
      <LandingDashboardShowcase />
      <LandingFeatureGrid />
      <LandingSplitFeature />
      <LandingStatsBand />
      <LandingTestimonial />
      <LandingCtaBand />
      <LandingFooter />
    </div>
  )
}
