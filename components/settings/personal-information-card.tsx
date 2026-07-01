export function PersonalInformationCard() {
  return (
    <div className="flex flex-col gap-5 rounded-[14px] border border-[#e8ebe6] bg-white p-6">
      <h2 className="font-sans inline-block text-[15px] font-semibold leading-normal text-[#1f2a26]">
        Personal information
      </h2>
      <div className="flex h-fit items-center gap-3.5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-[#c8e5de] bg-[#edf6f3]">
          <span className="font-sans text-lg font-semibold leading-normal text-[#2f6f61]">
            AA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center rounded-lg border border-[#c8e5de] bg-white px-3 py-[7px]"
          >
            <span className="font-sans text-[12.5px] font-medium leading-normal text-[#2f6f61]">
              Change photo
            </span>
          </button>
          <button
            type="button"
            className="flex items-center px-3 py-[7px]"
          >
            <span className="font-sans text-[12.5px] leading-normal text-[#8a948d]">
              Remove
            </span>
          </button>
        </div>
      </div>
      <div className="flex h-fit gap-3.5">
        <Field label="Full name" value="Asef Ahmed" />
        <Field label="Email" value="asef.ahmed@northwind.co" />
      </div>
      <div className="flex h-fit gap-3.5">
        <Field label="Job title" value="People Operations Lead" />
        <Field label="Department" value="People" />
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-[5px]">
      <span className="font-sans inline-block text-xs font-medium leading-normal text-[#8a948d]">
        {label}
      </span>
      <div className="flex h-10 items-center rounded-[10px] border border-[#e8ebe6] bg-white px-3 py-2.5">
        <span className="font-sans text-[13.5px] leading-normal text-[#1f2a26]">
          {value}
        </span>
      </div>
    </div>
  )
}
