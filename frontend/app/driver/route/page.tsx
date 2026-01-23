"use client";"use client";



import { useState, useEffect } from "react";import { useMemo } from "react";

import { useAuth } from "@/lib/auth-context";import Badge from "@/components/ui/badge";

import { useRouter } from "next/navigation";import Button from "@/components/ui/button";

import Card from "@/components/ui/card";

interface Stop {

  id: number;const nextStop = {

  address: string;  client: "Mouna Idrissi",

  city: string;  address: "Orleans Sidi Maarouf, Casablanca",

  parcelCount: number;  contact: "+212 6 12 34 56 78",

  status: "pending" | "current" | "delivered";  parcelId: "PKG-92183",

  distance?: string;  eta: "11:08",

  eta?: string;  distance: "2.3 km",

  priority?: "high" | "normal";  slot: "09h - 12h",

}};



// Mock dataconst upcomingStops = [

const mockRoute: Stop[] = [  { id: "#2048", address: "Rue Ibn Ghazi, Maarif", distance: "4.7 km", eta: "11:40", priority: "Haute" },

  { id: 1, address: "88 Market Street", city: "Springfield, IL 62701", parcelCount: 2, status: "delivered" },  { id: "#2049", address: "Bd Ghandi, Oasis", distance: "6.1 km", eta: "12:10", priority: "Normale" },

  { id: 2, address: "123 Delivery Lane", city: "Springfield, IL 62704", parcelCount: 3, status: "current", distance: "2.3 km", eta: "11:08", priority: "high" },  { id: "#2050", address: "Anfa Supérieur", distance: "8.4 km", eta: "12:45", priority: "Normale" },

  { id: 3, address: "456 Oak Boulevard", city: "Springfield, IL 62705", parcelCount: 1, status: "pending", distance: "4.7 km", eta: "11:40" },];

  { id: 4, address: "789 Pine Street, Apt 4B", city: "Springfield, IL 62706", parcelCount: 5, status: "pending", distance: "6.1 km", eta: "12:10" },

  { id: 5, address: "1011 Cedar Heights Dr", city: "Springfield, IL 62707", parcelCount: 2, status: "pending", distance: "8.4 km", eta: "12:45" },export default function DriverRoutePage() {

];  const destinationParam = useMemo(

    () => encodeURIComponent(`${nextStop.address}`),

export default function DriverRoutePage() {    []

  const { user, isLoading } = useAuth();  );

  const router = useRouter();

  const [route] = useState<Stop[]>(mockRoute);  const handleOpenNavigation = (provider: "google" | "waze") => {

  const [activeTab, setActiveTab] = useState<"route" | "map" | "parcels" | "profile">("route");    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`;

    const wazeUrl = `https://waze.com/ul?q=${destinationParam}&navigate=yes`;

  useEffect(() => {    const url = provider === "google" ? googleUrl : wazeUrl;

    if (!isLoading && (!user || user.role !== "chauffeur")) {    window.open(url, "_blank", "noopener,noreferrer");

      router.push("/login");  };

    }

  }, [user, isLoading, router]);  return (

    <main className="min-h-screen bg-neutral-50">

  const currentStop = route.find(s => s.status === "current");      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">

  const upcomingStops = route.filter(s => s.status === "pending");        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

  const deliveredCount = route.filter(s => s.status === "delivered").length;          <div className="flex items-center gap-3">

  const totalStops = route.length;            <div className="rounded-full bg-brand-500 px-3 py-2 text-sm font-bold text-white">LH</div>

  const progress = Math.round((deliveredCount / totalStops) * 100);            <div>

              <p className="text-xs uppercase tracking-wide text-neutral-500">Navigation Chauffeur</p>

  const handleStartNavigation = () => {              <h1 className="text-xl font-semibold text-neutral-900">Tournée du jour</h1>

    if (currentStop) {            </div>

      const destination = encodeURIComponent(`${currentStop.address}, ${currentStop.city}`);          </div>

      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;          <Badge variant="success">En route</Badge>

      window.open(url, "_blank", "noopener,noreferrer");        </div>

    }      </header>

  };

      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">

  if (isLoading || !user) {        <Card elevated className="p-6">

    return (          <div className="flex flex-wrap items-start justify-between gap-4">

      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">            <div>

        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent"></div>              <p className="text-sm uppercase tracking-wide text-neutral-500">Prochain arrêt</p>

      </div>              <h2 className="mt-1 text-2xl font-semibold text-neutral-900">{nextStop.client}</h2>

    );              <p className="text-neutral-600">{nextStop.address}</p>

  }              <p className="text-sm text-neutral-500">{nextStop.contact}</p>

            </div>

  return (            <div className="flex items-center gap-3">

    <div className="min-h-screen bg-neutral-50 flex flex-col">              <Badge variant="success">ETA {nextStop.eta}</Badge>

      {/* Header */}              <Badge variant="info">{nextStop.distance}</Badge>

      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-100">              <Badge variant="neutral">Créneau {nextStop.slot}</Badge>

        <div className="flex items-center gap-3">            </div>

          <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center overflow-hidden">          </div>

            <span className="text-white font-bold text-lg">

              {user.username?.charAt(0).toUpperCase() || "D"}          <div className="mt-5 grid gap-4 md:grid-cols-3">

            </span>            <div className="md:col-span-2 space-y-4">

          </div>              <div className="grid gap-4 sm:grid-cols-2">

          <div>                <Card className="p-4">

            <p className="font-semibold text-neutral-900">Hello, {user.username?.split("@")[0] || "Driver"}</p>                  <p className="text-sm uppercase tracking-wide text-neutral-500">Statut colis</p>

            <p className="text-xs text-neutral-500">DRIVER #{user.id}</p>                  <p className="text-lg font-semibold text-neutral-900">{nextStop.parcelId}</p>

          </div>                  <p className="text-neutral-600">Remettre en main propre.</p>

        </div>                </Card>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-200">                <Card className="p-4">

          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>                  <p className="text-sm uppercase tracking-wide text-neutral-500">Pré-brief client</p>

          <span className="text-sm font-medium text-neutral-700">Route Active</span>                  <p className="text-neutral-700">Mentionner contrôle d’identité et signature.</p>

        </div>                  <p className="text-sm text-neutral-500">Prévenir à l’arrivée : {nextStop.contact}</p>

      </header>                </Card>

              </div>

      {/* Main Content */}

      <main className="flex-1 overflow-auto px-4 py-4 space-y-4 pb-20">              <div className="flex flex-wrap gap-3">

        {/* Progress Card */}                <Button className="px-5 py-3" onClick={() => handleOpenNavigation("google")}>

        <div className="bg-neutral-100 rounded-2xl p-4">                  Ouvrir Google Maps

          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">OVERALL PROGRESS</p>                </Button>

          <div className="flex items-end justify-between mt-1">                <Button

            <p className="text-2xl font-bold text-neutral-900">Stop {deliveredCount + 1} of {totalStops}</p>                  variant="secondary"

            <p className="text-brand-500 font-semibold">{progress}% Done</p>                  className="px-5 py-3"

          </div>                  onClick={() => handleOpenNavigation("waze")}

          <div className="mt-3 h-2 bg-neutral-200 rounded-full overflow-hidden">                >

            <div                   Ouvrir Waze

              className="h-full bg-brand-500 rounded-full transition-all duration-500"                </Button>

              style={{ width: `${progress}%` }}                <Button variant="outline" className="px-5 py-3">

            ></div>                  Signaler un incident

          </div>                </Button>

        </div>              </div>

            </div>

        {/* Current Stop Section */}

        {currentStop && (            <div>

          <>              <Card className="h-full p-4">

            <div className="flex items-center justify-between">                <p className="text-sm uppercase tracking-wide text-neutral-500">Étapes restantes</p>

              <h2 className="text-lg font-semibold text-neutral-900">Current Stop</h2>                <div className="mt-3 space-y-3">

              {currentStop.priority === "high" && (                  {upcomingStops.map((stop) => (

                <span className="px-2.5 py-1 bg-brand-500 text-white text-xs font-semibold rounded-full uppercase">                    <div key={stop.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">

                  Priority                      <div className="flex items-center justify-between text-sm font-semibold text-neutral-900">

                </span>                        <span>{stop.id}</span>

              )}                        <span className="text-xs text-neutral-500">{stop.eta}</span>

            </div>                      </div>

                      <p className="text-sm text-neutral-700">{stop.address}</p>

            <div className="bg-white rounded-2xl border-2 border-brand-500 p-4 shadow-sm">                      <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">

              <div className="flex items-center gap-2 mb-3">                        <Badge variant={stop.priority === "Haute" ? "danger" : "neutral"}>{stop.distance}</Badge>

                <span className="px-2.5 py-1 bg-neutral-900 text-white text-xs font-semibold rounded">                        <span>{stop.priority}</span>

                  STOP {currentStop.id}                      </div>

                </span>                    </div>

                <span className="text-brand-500 font-semibold text-sm">                  ))}

                  {currentStop.parcelCount} PARCELS                </div>

                </span>              </Card>

              </div>            </div>

                        </div>

              <h3 className="text-xl font-bold text-neutral-900 mb-1">        </Card>

                {currentStop.address}, {currentStop.city}

              </h3>        <div className="grid gap-4 md:grid-cols-3">

          <Card className="p-5">

              {/* Map Preview Placeholder */}            <p className="text-sm uppercase tracking-wide text-neutral-500">Progression</p>

              <div className="bg-neutral-100 rounded-xl h-32 my-4 flex items-center justify-center overflow-hidden relative">            <div className="mt-3 flex items-end gap-3">

                <div className="absolute inset-0 bg-gradient-to-br from-accent-50 to-brand-50 opacity-50"></div>              <p className="text-3xl font-bold text-neutral-900">8</p>

                <p className="text-neutral-400 text-sm relative z-10">Map Preview</p>              <p className="text-neutral-500">sur 15 livraisons</p>

              </div>            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-neutral-200">

              {/* Action Buttons */}              <div className="h-full w-2/3 rounded-full bg-brand-500" />

              <div className="flex gap-3">            </div>

                <button          </Card>

                  onClick={handleStartNavigation}

                  className="flex-1 py-4 bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-600 active:scale-[0.98] transition-all"          <Card className="p-5">

                >            <p className="text-sm uppercase tracking-wide text-neutral-500">Alertes</p>

                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">            <div className="mt-3 flex items-center gap-3">

                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>              <Badge variant="danger">1 incident</Badge>

                  </svg>              <Badge variant="warning">2 retards</Badge>

                  START NAVIGATION            </div>

                </button>            <p className="mt-3 text-sm text-neutral-600">

                <button className="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center hover:bg-neutral-200 transition-colors">              Contactez le support si la tournée est bloquée.

                  <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">            </p>

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />          </Card>

                  </svg>

                </button>          <Card className="p-5">

              </div>            <p className="text-sm uppercase tracking-wide text-neutral-500">Ressources rapides</p>

            </div>            <div className="mt-3 flex flex-wrap gap-2">

          </>              <Badge variant="info">Procédure refus</Badge>

        )}              <Badge variant="neutral">Consignes dépôt</Badge>

              <Badge variant="success">Support live</Badge>

        {/* Upcoming Queue */}            </div>

        <h2 className="text-lg font-semibold text-neutral-900 mt-6">Upcoming Queue</h2>            <Button variant="ghost" className="mt-4 px-4 py-2">

        <div className="space-y-3">              Voir toutes les procédures

          {upcomingStops.map((stop) => (            </Button>

            <div          </Card>

              key={stop.id}        </div>

              className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-4 hover:border-neutral-300 transition-colors cursor-pointer"      </section>

            >    </main>

              <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 font-semibold">  );

                {stop.id}}

              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 truncate">{stop.address}</p>
                <p className="text-sm text-neutral-500">
                  {stop.parcelCount} PARCEL{stop.parcelCount > 1 ? "S" : ""} • PENDING
                </p>
              </div>
              <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 py-2">
        <div className="flex justify-around">
          {[
            { id: "route", icon: "list", label: "ROUTE" },
            { id: "map", icon: "map", label: "MAP" },
            { id: "parcels", icon: "package", label: "PARCELS" },
            { id: "profile", icon: "user", label: "PROFILE" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex flex-col items-center gap-1 py-2 px-4 ${
                activeTab === tab.id ? "text-brand-500" : "text-neutral-400"
              }`}
            >
              {tab.icon === "list" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              )}
              {tab.icon === "map" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              )}
              {tab.icon === "package" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
              {tab.icon === "user" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
