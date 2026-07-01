import { cn } from "@/lib/utils"

type CardTone = "green" | "amber" | "forest" | "mint" | "coral" | "slate"

type Card = {
  initials: string
  name: string
  owner: string
  fillPct: number
  footerLeft: string
  footerLeftClass?: "muted" | "shipped"
  footerRight: string
  tone: CardTone
}

type Column = {
  title: string
  count: string
  dot: string
  titleColor: string
  headerBg: string
  headerBorder: string
  countChipBg: string
  countChipText: string
  cards?: Card[]
  placeholder?: string
}

const cardTone: Record<CardTone, { avatarBg: string; avatarText: string }> = {
  green: { avatarBg: "bg-[#3bb27326]", avatarText: "text-[#2e9160]" },
  amber: { avatarBg: "bg-[#f4a2612e]", avatarText: "text-[#b96a2c]" },
  forest: { avatarBg: "bg-[#2f6f611f]", avatarText: "text-[#2f6f61]" },
  mint: { avatarBg: "bg-[#64b6ac29]", avatarText: "text-[#3e9488]" },
  coral: { avatarBg: "bg-[#d0553f26]", avatarText: "text-[#b8462f]" },
  slate: { avatarBg: "bg-[#64748b26]", avatarText: "text-[#475569]" },
}

const columns: Column[] = [
  {
    title: "On track",
    count: "16",
    dot: "bg-[#2f6fd0]",
    titleColor: "text-[#2f6fd0]",
    headerBg: "bg-[#2f6fd00d]",
    headerBorder: "border-[#2f6fd01a]",
    countChipBg: "bg-[#2f6fd01f]",
    countChipText: "text-[#2f6fd0]",
    cards: [
      {
        initials: "AC",
        name: "Aurora Checkout",
        owner: "Product · Sofia Alvarez",
        fillPct: 86,
        footerLeft: "Due Mar 14",
        footerRight: "86%",
        tone: "green",
      },
      {
        initials: "PL",
        name: "Pipeline Launch",
        owner: "Sales · Marcus Bailey",
        fillPct: 74,
        footerLeft: "Due Mar 03",
        footerRight: "74%",
        tone: "amber",
      },
      {
        initials: "OR",
        name: "Onboarding Revamp",
        owner: "People · Lena Fischer",
        fillPct: 100,
        footerLeft: "✓ Shipped",
        footerLeftClass: "shipped",
        footerRight: "100%",
        tone: "forest",
      },
      {
        initials: "GC",
        name: "Growth Campaign",
        owner: "Marketing · Hana Lindqvist",
        fillPct: 69,
        footerLeft: "Due Mar 21",
        footerRight: "69%",
        tone: "mint",
      },
    ],
  },
  {
    title: "At risk",
    count: "2",
    dot: "bg-[#d98a2b]",
    titleColor: "text-[#d98a2b]",
    headerBg: "bg-[#d98a2b0d]",
    headerBorder: "border-[#d98a2b1a]",
    countChipBg: "bg-[#d98a2b1f]",
    countChipText: "text-[#d98a2b]",
    cards: [
      {
        initials: "AG",
        name: "API Gateway",
        owner: "Engineering · Daniel Okafor",
        fillPct: 42,
        footerLeft: "Due Feb 28",
        footerRight: "42%",
        tone: "amber",
      },
    ],
  },
  {
    title: "Delayed",
    count: "1",
    dot: "bg-[#d0553f]",
    titleColor: "text-[#d0553f]",
    headerBg: "bg-[#d0553f0d]",
    headerBorder: "border-[#d0553f1a]",
    countChipBg: "bg-[#d0553f1f]",
    countChipText: "text-[#d0553f]",
    cards: [
      {
        initials: "DP",
        name: "Data Platform",
        owner: "Engineering · Priya Nair",
        fillPct: 28,
        footerLeft: "Was Feb 14",
        footerRight: "28%",
        tone: "coral",
      },
    ],
  },
  {
    title: "On hold",
    count: "1",
    dot: "bg-[#8a948d]",
    titleColor: "text-[#8a948d]",
    headerBg: "bg-[#8a948d0d]",
    headerBorder: "border-[#8a948d1a]",
    countChipBg: "bg-[#8a948d1f]",
    countChipText: "text-[#8a948d]",
    placeholder: "1 project paused",
  },
]

export function KanbanBoard() {
  return (
    <div className="flex gap-4">
      {columns.map((col) => (
        <KanbanColumn key={col.title} col={col} />
      ))}
    </div>
  )
}

function KanbanColumn({ col }: { col: Column }) {
  return (
    <div className="flex min-w-[220px] flex-1 flex-col gap-2.5 rounded-xl border border-[#e8ebe6] bg-[#f8f9fa] p-3">
      <div
        className={cn(
          "mx-0 mb-1 mt-0 flex items-center justify-between gap-2 rounded-[10px] border px-3 py-1.5",
          col.headerBg,
          col.headerBorder,
        )}
      >
        <span className={`size-2 shrink-0 rounded-full ${col.dot}`} />
        <span
          className={cn(
            "flex-1 font-sans text-[11px] font-bold uppercase leading-normal tracking-[0.55px]",
            col.titleColor,
          )}
        >
          {col.title}
        </span>
        <span
          className={cn(
            "flex items-center justify-center rounded-full px-2 py-0.5 font-sans text-[11px] font-semibold leading-normal",
            col.countChipBg,
            col.countChipText,
          )}
        >
          {col.count}
        </span>
      </div>
      {col.cards?.map((card) => (
        <KanbanCard key={card.initials + card.name} card={card} />
      ))}
      {col.placeholder ? <PlaceholderCard text={col.placeholder} /> : null}
    </div>
  )
}

function KanbanCard({ card }: { card: Card }) {
  const tone = cardTone[card.tone]
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-[#edeae3] bg-white p-4">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-[30px] shrink-0 items-center justify-center rounded-lg",
            tone.avatarBg,
          )}
        >
          <span
            className={cn(
              "font-sans text-[10px] font-semibold leading-normal",
              tone.avatarText,
            )}
          >
            {card.initials}
          </span>
        </div>
        <span className="min-w-0 flex-1 font-sans text-[13px] font-semibold leading-tight text-[#1f2a26]">
          {card.name}
        </span>
      </div>
      <span className="font-sans inline-block text-[11.5px] leading-normal text-[#8a948d]">
        {card.owner}
      </span>
      <div className="flex flex-col gap-1.5">
        <div className="flex h-1.5 w-full overflow-clip rounded-full bg-[#f1eee8]">
          <div
            className="h-full rounded-full bg-[#2e9160]"
            style={{ width: `${card.fillPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "font-sans inline-block text-[11px] leading-normal",
              card.footerLeftClass === "shipped"
                ? "font-semibold text-[#2e9160]"
                : "text-[#8a948d]",
            )}
          >
            {card.footerLeft}
          </span>
          <span className="font-sans inline-block text-[11px] font-semibold leading-normal text-[#42504a]">
            {card.footerRight}
          </span>
        </div>
      </div>
    </div>
  )
}

function PlaceholderCard({ text }: { text: string }) {
  return (
    <div className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#edeae3] bg-white p-4">
      <div className="flex size-7 items-center justify-center rounded-full bg-[#f1eee8]">
        <span className="font-sans text-sm leading-none text-[#8a948d]">⋯</span>
      </div>
      <span className="font-sans inline-block text-center text-[11.5px] leading-normal text-[#8a948d]">
        {text}
      </span>
    </div>
  )
}
