import Link from "next/link"
import { Bot, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="animate-slide-in-up">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">
              DG
            </div>
            <div>
              <strong className="block text-2xl">DG AI &#x6570;&#x5B57;&#x4EBA;&#x5BFC;&#x89C8;</strong>
              <span className="text-sm text-muted-foreground">&#x6E38;&#x5BA2;&#x7AEF;&#x4E0E;&#x7BA1;&#x7406;&#x540E;&#x53F0;&#x5165;&#x53E3;</span>
            </div>
          </div>
          <h1 className="mb-4 max-w-2xl text-4xl font-bold leading-tight text-foreground md:text-6xl">
            &#x9009;&#x62E9;&#x8981;&#x8FDB;&#x5165;&#x7684;&#x5DE5;&#x4F5C;&#x7A7A;&#x95F4;
          </h1>
          <p className="max-w-xl text-base leading-8 text-muted-foreground">
            &#x6E38;&#x5BA2;&#x7AEF;&#x7528;&#x4E8E; AI &#x5BFC;&#x89C8;&#x95EE;&#x7B54;&#x548C;&#x8DEF;&#x7EBF;&#x63A8;&#x8350;&#xFF1B;&#x7BA1;&#x7406;&#x540E;&#x53F0;&#x4F7F;&#x7528; Tasko &#x6A21;&#x677F;&#x754C;&#x9762;&#x7BA1;&#x7406;&#x77E5;&#x8BC6;&#x5E93;&#x3001;&#x666F;&#x533A;&#x6570;&#x636E;&#x548C;&#x6570;&#x5B57;&#x4EBA;&#x914D;&#x7F6E;&#x3002;
          </p>
        </section>

        <section className="grid gap-4">
          <Card className="animate-slide-in-up p-6 shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl" style={{ animationDelay: "100ms" }}>
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">&#x6E38;&#x5BA2;&#x5BFC;&#x89C8;&#x7AEF;</h2>
                <p className="text-sm text-muted-foreground">&#x8FDB;&#x5165; AI &#x5BFC;&#x89C8;&#x95EE;&#x7B54;&#x3001;&#x5174;&#x8DA3;&#x504F;&#x597D;&#x548C;&#x8DEF;&#x7EBF;&#x63A8;&#x8350;&#x3002;</p>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/visitor">&#x8FDB;&#x5165;&#x6E38;&#x5BA2;&#x7AEF;</Link>
            </Button>
          </Card>

          <Card className="animate-slide-in-up p-6 shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl" style={{ animationDelay: "180ms" }}>
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Tasko &#x7BA1;&#x7406;&#x540E;&#x53F0;</h2>
                <p className="text-sm text-muted-foreground">&#x8FDB;&#x5165;&#x73B0;&#x4EE3; SaaS &#x98CE;&#x683C;&#x8FD0;&#x8425;&#x540E;&#x53F0;&#x3002;</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/admin">&#x8FDB;&#x5165;&#x7BA1;&#x7406;&#x540E;&#x53F0;</Link>
            </Button>
          </Card>
        </section>
      </div>
    </main>
  )
}
