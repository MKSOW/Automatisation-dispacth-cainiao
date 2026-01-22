import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">
        Cainiao Logistics Hub
      </h1>
      <p className="text-slate-600 max-w-lg">
        Frontend Next.js en cours de construction. Rendez-vous sur l’écran de
        connexion pour accéder au tableau de bord.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-brand-500 px-6 py-3 text-white shadow-lg transition hover:bg-brand-600"
      >
        Accéder à la page de connexion
      </Link>
    </main>
  );
}
