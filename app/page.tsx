import Link from "next/link"
import { ArrowUpRight, Bot, Check, LayoutDashboard, MapPin, Mountain, Sparkles } from "lucide-react"

const scenicImages = [
  "/assets/images/lingshan-hero.png",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Huangshan_pic_4.jpg?width=2400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Great_Wall_of_China_July_2006.JPG?width=2400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Li_River,_Guilin,_China.jpg?width=2400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Zhangjiajie_National_Forest_Park.jpg?width=2400",
]

const labels = {
  brand: "DG AI",
  navVisitor: "\u6E38\u5BA2\u7AEF",
  navAdmin: "\u7BA1\u7406\u540E\u53F0",
  badge: "\u5168\u666F\u533A AI \u5BFC\u89C8\u4F53\u9A8C",
  title: "\u8BA9\u6BCF\u4E00\u6B21\u65C5\u884C\u90FD\u6709\u4E00\u4F4D\u968F\u884C\u7684 AI \u5BFC\u89C8\u5458",
  desc: "\u6E38\u5BA2\u53EF\u4EE5\u76F4\u63A5\u8FDB\u5165\u5BFC\u89C8\u95EE\u7B54\uFF0C\u7BA1\u7406\u5458\u53EF\u4EE5\u8FDB\u5165 Tasko \u98CE\u683C\u7684\u8FD0\u8425\u540E\u53F0\u7BA1\u7406\u77E5\u8BC6\u5E93\u3001\u666F\u533A\u6570\u636E\u548C\u6570\u5B57\u4EBA\u3002",
  visitor: "\u8FDB\u5165\u6E38\u5BA2\u7AEF",
  admin: "\u7BA1\u7406\u5458\u767B\u5F55",
  helped: "\u5DF2\u652F\u6301\u666F\u533A\u95EE\u7B54\u3001\u8DEF\u7EBF\u63A8\u8350\u548C\u8BED\u97F3\u4E92\u52A8",
  pointA: "\u667A\u80FD\u95EE\u7B54",
  pointB: "\u8DEF\u7EBF\u89C4\u5212",
  pointC: "\u77E5\u8BC6\u5165\u5E93",
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-muted p-3 md:p-5">
      <section className="relative flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[28px] bg-emerald-950 md:min-h-[calc(100vh-2.5rem)]">
        <div className="absolute inset-0">
          {scenicImages.map((image, index) => (
            <div
              key={image}
              className="scenic-slide absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${image})`,
                animation: `scenicFade 25s infinite`,
                animationDelay: `${index * 5}s`,
                opacity: index === 0 ? 1 : 0,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />
        </div>

        <div className="relative flex flex-1 flex-col px-4 pt-5 pb-6 md:px-8 md:pt-6 md:pb-10">
          <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 animate-slide-in-up">
            <div className="flex flex-1 items-center justify-between rounded-full bg-white px-5 py-3 shadow-sm md:px-7 md:py-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">DG</span>
                <span className="text-lg font-semibold tracking-tight">
                  <span className="text-primary">{labels.brand}</span>
                  <span className="text-foreground"> Guide</span>
                </span>
              </Link>
              <div className="hidden items-center gap-1 md:flex">
                <Link className="rounded-full bg-green-50 px-4 py-1.5 text-sm font-semibold text-foreground" href="/visitor">{labels.navVisitor}</Link>
                <Link className="rounded-full px-4 py-1.5 text-sm text-muted-foreground transition hover:text-foreground" href="/admin">{labels.navAdmin}</Link>
              </div>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-primary py-3 pl-6 pr-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 md:py-4 md:pl-7 md:pr-4"
            >
              <span>{labels.admin}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </nav>

          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center pt-12 md:pt-16">
            <div className="text-center">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/25 px-4 py-2 text-sm text-white backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                {labels.badge}
              </div>
              <h1 className="mx-auto max-w-5xl text-balance text-4xl font-medium leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
                {labels.title}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base font-medium leading-relaxed text-white/90 drop-shadow md:text-lg">
                {labels.desc}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/visitor"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  <Bot className="h-4 w-4" />
                  {labels.visitor}
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/50 bg-white/10 px-7 text-base font-medium text-white backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {labels.admin}
                </Link>
              </div>

              <div className="relative mt-24 flex items-end justify-between gap-4 md:mt-44">
                <div className="flex items-center gap-3 rounded-2xl bg-black/35 px-4 py-3 pr-5 text-white backdrop-blur-md">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary">
                    <Mountain className="h-5 w-5" />
                  </div>
                  <p className="max-w-64 text-left text-xs leading-tight md:text-sm">{labels.helped}</p>
                </div>

                <ul className="hidden flex-wrap items-center justify-end gap-3 md:flex">
                  {[labels.pointA, labels.pointB, labels.pointC].map((item) => (
                    <li key={item} className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/25 px-4 py-2 text-sm text-white backdrop-blur-md">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-xs text-white/85 backdrop-blur-md md:flex">
            <MapPin className="h-3.5 w-3.5" />
            Huangshan / Zhangjiajie / Guilin / Great Wall
          </div>
        </div>
      </section>

      <style>{`
        @keyframes scenicFade {
          0% { opacity: 0; transform: scale(1.02); filter: saturate(0.92) contrast(1.02); }
          4% { opacity: 1; }
          20% { opacity: 1; }
          28% { opacity: 0; transform: scale(1.09); filter: saturate(1.08) contrast(1.06); }
          100% { opacity: 0; transform: scale(1.09); filter: saturate(1.08) contrast(1.06); }
        }
      `}</style>
    </main>
  )
}
