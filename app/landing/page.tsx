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

export default function LandingPage() {
  return (
    <div className="flex min-h-svh w-full flex-col bg-[#faf9f5]">
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
