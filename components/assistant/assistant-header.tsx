import { BotMessageSquare } from "lucide-react"

export function AssistantHeader() {
  return (
    <div className="flex w-full shrink-0 items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-foreground">
          <BotMessageSquare className="size-5 text-background" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-[3px]">
          <h1 className="inline-block text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground">
            AI Assistant
          </h1>
          <p className="font-sans inline-block text-[13.5px] leading-normal text-muted-foreground">
            Ask about people data, policies, and workflows
          </p>
        </div>
      </div>
    </div>
  )
}
