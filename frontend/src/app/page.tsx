import Link from "next/link";

const modules = [
  { href: "/signup", label: "Signup", desc: "Multi-step seller onboarding" },
  { href: "/products/sample", label: "Product View", desc: "Product details, pricing, checkout" },
  { href: "/orders/sample", label: "Order Details", desc: "Seller order tracking & metrics" },
  { href: "/admin", label: "Admin", desc: "Management, legal, workers, support" },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Vehsl</h1>
        {/* <p className="text-muted-foreground">Commerce platform — Next.js 15 migration in progress.</p> */}
      </header>
      <section className="grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
          >
            <h2 className="text-lg font-medium group-hover:text-primary">{m.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
