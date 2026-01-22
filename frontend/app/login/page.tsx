"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { loginRequest } from "@/lib/api";
import classNames from "classnames";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Veuillez saisir vos identifiants.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginRequest(email, password);
      setSuccess(`Bienvenue ${response.username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="flex items-center justify-between px-10 py-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-brand-500 p-2 text-white font-bold">LH</div>
          <span className="font-semibold text-slate-900">Logistics Hub</span>
        </div>
        <Link href="#" className="hover:text-brand-500">
          Help Center
        </Link>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 md:flex-row">
        <div className="hidden flex-1 rounded-3xl bg-white/70 p-8 shadow-xl md:flex md:flex-col md:justify-center">
          <h2 className="text-3xl font-semibold text-slate-900">
            Smart dispatch.
            <br />
            Faster deliveries.
          </h2>
          <p className="mt-4 text-slate-600">
            Centralisez vos opérations de dispatch, tri et livraison sur une
            plateforme unifiée pensée pour les équipes Cainiao Expert.
          </p>
        </div>

        <div className="flex-1">
          <div className="rounded-3xl bg-white p-8 shadow-2xl">
            <h1 className="text-center text-2xl font-semibold text-slate-900">
              Welcome Back
            </h1>
            <p className="mt-2 text-center text-slate-500">
              Smart dispatch. Faster deliveries.
            </p>

            <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="text-sm font-medium text-slate-700">
                Work Email
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Password
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
                    checked={remember}
                    onChange={() => setRemember((prev) => !prev)}
                  />
                  Remember this device
                </label>
                <Link href="#" className="font-medium text-brand-500">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                  {success}
                </p>
              )}

              <button
                type="submit"
                className={classNames(
                  "rounded-2xl bg-brand-500 py-3 text-white shadow-lg transition", 
                  "hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200", 
                  { "opacity-70": loading }
                )}
                disabled={loading}
              >
                {loading ? "Connexion…" : "Sign In to Dashboard"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don’t have an account? <strong>Contact Admin</strong>
            </p>
          </div>

          <footer className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-slate-400">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
