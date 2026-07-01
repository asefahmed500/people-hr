export function ConversionRateCard() {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-[18px] border border-[#edeae3] bg-white p-6">
      <span className="font-sans inline-block text-xs leading-normal text-[#8a948d]">
        Applicant → Hire conversion
      </span>
      <span className="font-display inline-block text-[42px] font-semibold leading-none text-[#e0663d]">
        6.3%
      </span>
      <span className="font-sans inline-block text-[11px] leading-normal text-[#8a948d]">
        Across all open roles this quarter
      </span>
    </div>
  )
}
