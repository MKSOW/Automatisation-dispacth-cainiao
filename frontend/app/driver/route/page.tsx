"use client";

import { useMemo } from "react";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

const nextStop = {
  client: "Mouna Idrissi",
  address: "Orleans Sidi Maarouf, Casablanca",
  contact: "+212 6 12 34 56 78",
  parcelId: "PKG-92183",
  eta: "11:08",
  distance: "2.3 km",
  slot: "09h - 12h",
};

const upcomingStops = [
  { id: "#2048", address: "Rue Ibn Ghazi, Maarif", distance: "4.7 km", eta: "11:40", priority: "Haute" },
  { id: "#2049", address: "Bd Ghandi, Oasis", distance: "6.1 km", eta: "12:10", priority: "Normale" },
  { id: "#2050", address: "Anfa Supérieur", distance: "8.4 km", eta: "12:45", priority: "Normale" },
];

export default function DriverRoutePage() {
  const destinationParam = useMemo(
    () => encodeURIComponent(`${nextStop.address}`),
    []
  );

  const handleOpenNavigation = (provider: "google" | "waze") => {
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`;
    const wazeUrl = `https://waze.com/ul?q=${destinationParam}&navigate=yes`;
    const url = provider === "google" ? googleUrl : wazeUrl;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-500 px-3 py-2 text-sm font-bold text-white">LH</div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Navigation Chauffeur</p>
              <h1 className="text-xl font-semibold text-neutral-900">Tournée du jour</h1>
            </div>
          </div>
          <Badge variant="success">En route</Badge>
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
        <Card elevated className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-neutral-500">Prochain arrêt</p>
              <h2 className="mt-1 text-2xl font-semibold text-neutral-900">{nextStop.client}</h2>
              <p className="text-neutral-600">{nextStop.address}</p>
              <p className="text-sm text-neutral-500">{nextStop.contact}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="success">ETA {nextStop.eta}</Badge>
              <Badge variant="info">{nextStop.distance}</Badge>
              <Badge variant="neutral">Créneau {nextStop.slot}</Badge>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4">
                  <p className="text-sm uppercase tracking-wide text-neutral-500">Statut colis</p>
                  <p className="text-lg font-semibold text-neutral-900">{nextStop.parcelId}</p>
                  <p className="text-neutral-600">Remettre en main propre.</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm uppercase tracking-wide text-neutral-500">Pré-brief client</p>
                  <p className="text-neutral-700">Mentionner contrôle d’identité et signature.</p>
                  <p className="text-sm text-neutral-500">Prévenir à l’arrivée : {nextStop.contact}</p>
                </Card>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="px-5 py-3" onClick={() => handleOpenNavigation("google")}>
                  Ouvrir Google Maps
                </Button>
                <Button
                  variant="secondary"
                  className="px-5 py-3"
                  onClick={() => handleOpenNavigation("waze")}
                >
                  Ouvrir Waze
                </Button>
                <Button variant="outline" className="px-5 py-3">
                  Signaler un incident
                </Button>
              </div>
            </div>

            <div>
              <Card className="h-full p-4">
                <p className="text-sm uppercase tracking-wide text-neutral-500">Étapes restantes</p>
                <div className="mt-3 space-y-3">
                  {upcomingStops.map((stop) => (
                    <div key={stop.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="flex items-center justify-between text-sm font-semibold text-neutral-900">
                        <span>{stop.id}</span>
                        <span className="text-xs text-neutral-500">{stop.eta}</span>
                      </div>
                      <p className="text-sm text-neutral-700">{stop.address}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                        <Badge variant={stop.priority === "Haute" ? "danger" : "neutral"}>{stop.distance}</Badge>
                        <span>{stop.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm uppercase tracking-wide text-neutral-500">Progression</p>
            <div className="mt-3 flex items-end gap-3">
              <p className="text-3xl font-bold text-neutral-900">8</p>
              <p className="text-neutral-500">sur 15 livraisons</p>
            </div>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full w-2/3 rounded-full bg-brand-500" />
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-sm uppercase tracking-wide text-neutral-500">Alertes</p>
            <div className="mt-3 flex items-center gap-3">
              <Badge variant="danger">1 incident</Badge>
              <Badge variant="warning">2 retards</Badge>
            </div>
            <p className="mt-3 text-sm text-neutral-600">
              Contactez le support si la tournée est bloquée.
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-sm uppercase tracking-wide text-neutral-500">Ressources rapides</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="info">Procédure refus</Badge>
              <Badge variant="neutral">Consignes dépôt</Badge>
              <Badge variant="success">Support live</Badge>
            </div>
            <Button variant="ghost" className="mt-4 px-4 py-2">
              Voir toutes les procédures
            </Button>
          </Card>
        </div>
      </section>
    </main>
  );
}
