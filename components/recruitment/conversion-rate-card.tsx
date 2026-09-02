export function ConversionRateCard({ rate }: { rate: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-6">
      <span className="font-sans inline-block text-xs leading-normal text-muted-foreground">
        Applicant → Hire conversion
      </span>
      <span className="inline-block text-[42px] font-semibold leading-none text-primary">
        {rate.toFixed(1)}%
      </span>
      <span className="font-sans inline-block text-[11px] leading-normal text-muted-foreground">
        Across all open roles this quarter
      </span>
    </div>
  )
}
