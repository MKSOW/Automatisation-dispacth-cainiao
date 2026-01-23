"use client";"use client";"use client";



import { useState, useEffect, useCallback } from "react";

import { useAuth } from "@/lib/auth-context";

import { useRouter } from "next/navigation";import { useState, useEffect } from "react";import { useMemo } from "react";

import { getDriverRoute, OptimizedStop } from "@/lib/api";

import { useAuth } from "@/lib/auth-context";import Badge from "@/components/ui/badge";

export default function DriverRoutePage() {

  const { user, isLoading } = useAuth();import { useRouter } from "next/navigation";import Button from "@/components/ui/button";

  const router = useRouter();

  const [stops, setStops] = useState<OptimizedStop[]>([]);import Card from "@/components/ui/card";

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);interface Stop {

  const [currentIndex, setCurrentIndex] = useState(0);

  id: number;const nextStop = {

  const loadRoute = useCallback(async () => {

    if (!user) return;  address: string;  client: "Mouna Idrissi",

    try {

      setLoading(true);  city: string;  address: "Orleans Sidi Maarouf, Casablanca",

      setError(null);

      const data = await getDriverRoute(user.id);  parcelCount: number;  contact: "+212 6 12 34 56 78",

      setStops(data);

    } catch (err) {  status: "pending" | "current" | "delivered";  parcelId: "PKG-92183",

      setError(err instanceof Error ? err.message : "Erreur de chargement");

    } finally {  distance?: string;  eta: "11:08",

      setLoading(false);

    }  eta?: string;  distance: "2.3 km",

  }, [user]);

  priority?: "high" | "normal";  slot: "09h - 12h",

  useEffect(() => {

    if (!isLoading && (!user || user.role !== "chauffeur")) {}};

      router.push("/login");

    } else if (!isLoading && user) {

      loadRoute();

    }// Mock dataconst upcomingStops = [

  }, [user, isLoading, router, loadRoute]);

const mockRoute: Stop[] = [  { id: "#2048", address: "Rue Ibn Ghazi, Maarif", distance: "4.7 km", eta: "11:40", priority: "Haute" },

  const currentStop = stops[currentIndex] || null;

  const upcomingStops = stops.slice(currentIndex + 1);  { id: 1, address: "88 Market Street", city: "Springfield, IL 62701", parcelCount: 2, status: "delivered" },  { id: "#2049", address: "Bd Ghandi, Oasis", distance: "6.1 km", eta: "12:10", priority: "Normale" },

  const deliveredCount = currentIndex;

  const totalStops = stops.length;  { id: 2, address: "123 Delivery Lane", city: "Springfield, IL 62704", parcelCount: 3, status: "current", distance: "2.3 km", eta: "11:08", priority: "high" },  { id: "#2050", address: "Anfa Supérieur", distance: "8.4 km", eta: "12:45", priority: "Normale" },

  const progress = totalStops > 0 ? Math.round((deliveredCount / totalStops) * 100) : 0;

  { id: 3, address: "456 Oak Boulevard", city: "Springfield, IL 62705", parcelCount: 1, status: "pending", distance: "4.7 km", eta: "11:40" },];

  const handleMarkDelivered = () => {

    if (currentIndex < stops.length - 1) {  { id: 4, address: "789 Pine Street, Apt 4B", city: "Springfield, IL 62706", parcelCount: 5, status: "pending", distance: "6.1 km", eta: "12:10" },

      setCurrentIndex(prev => prev + 1);

    }  { id: 5, address: "1011 Cedar Heights Dr", city: "Springfield, IL 62707", parcelCount: 2, status: "pending", distance: "8.4 km", eta: "12:45" },export default function DriverRoutePage() {

  };

];  const destinationParam = useMemo(

  const handleOpenNavigation = (provider: "google" | "waze") => {

    if (!currentStop) return;    () => encodeURIComponent(`${nextStop.address}`),

    const url = provider === "google" ? currentStop.google_maps_url : currentStop.waze_url;

    window.open(url, "_blank", "noopener,noreferrer");export default function DriverRoutePage() {    []

  };

  const { user, isLoading } = useAuth();  );

  if (isLoading || !user) {

    return (  const router = useRouter();

      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">

        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent"></div>  const [route] = useState<Stop[]>(mockRoute);  const handleOpenNavigation = (provider: "google" | "waze") => {

      </div>

    );  const [activeTab, setActiveTab] = useState<"route" | "map" | "parcels" | "profile">("route");    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`;

  }

    const wazeUrl = `https://waze.com/ul?q=${destinationParam}&navigate=yes`;

  return (

    <div className="min-h-screen bg-neutral-50 flex flex-col">  useEffect(() => {    const url = provider === "google" ? googleUrl : wazeUrl;

      {/* Header */}

      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-100">    if (!isLoading && (!user || user.role !== "chauffeur")) {    window.open(url, "_blank", "noopener,noreferrer");

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center overflow-hidden">      router.push("/login");  };

            <span className="text-white font-bold text-lg">

              {user.username?.charAt(0).toUpperCase() || "D"}    }

            </span>

          </div>  }, [user, isLoading, router]);  return (

          <div>

            <p className="font-semibold text-neutral-900">Hello, {user.username || "Driver"}</p>    <main className="min-h-screen bg-neutral-50">

            <p className="text-xs text-neutral-500">DRIVER #{user.id}</p>

          </div>  const currentStop = route.find(s => s.status === "current");      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">

        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-200">  const upcomingStops = route.filter(s => s.status === "pending");        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>

          <span className="text-sm font-medium text-neutral-700">Route Active</span>  const deliveredCount = route.filter(s => s.status === "delivered").length;          <div className="flex items-center gap-3">

        </div>

      </header>  const totalStops = route.length;            <div className="rounded-full bg-brand-500 px-3 py-2 text-sm font-bold text-white">LH</div>



      {/* Main Content */}  const progress = Math.round((deliveredCount / totalStops) * 100);            <div>

      <main className="flex-1 overflow-auto px-4 py-4 space-y-4 pb-20">

        {loading ? (              <p className="text-xs uppercase tracking-wide text-neutral-500">Navigation Chauffeur</p>

          <div className="flex items-center justify-center py-12">

            <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent"></div>  const handleStartNavigation = () => {              <h1 className="text-xl font-semibold text-neutral-900">Tournée du jour</h1>

          </div>

        ) : error ? (    if (currentStop) {            </div>

          <div className="text-center py-12">

            <p className="text-danger-600 mb-4">{error}</p>      const destination = encodeURIComponent(`${currentStop.address}, ${currentStop.city}`);          </div>

            <button onClick={loadRoute} className="px-4 py-2 bg-brand-500 text-white rounded-lg">

              Réessayer      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;          <Badge variant="success">En route</Badge>

            </button>

          </div>      window.open(url, "_blank", "noopener,noreferrer");        </div>

        ) : stops.length === 0 ? (

          <div className="text-center py-12">    }      </header>

            <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">

              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">  };

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">

              </svg>

            </div>  if (isLoading || !user) {        <Card elevated className="p-6">

            <p className="text-neutral-600">Aucune tournée assignée pour aujourd&apos;hui</p>

          </div>    return (          <div className="flex flex-wrap items-start justify-between gap-4">

        ) : (

          <>      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">            <div>

            {/* Progress Card */}

            <div className="bg-neutral-100 rounded-2xl p-4">        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent"></div>              <p className="text-sm uppercase tracking-wide text-neutral-500">Prochain arrêt</p>

              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">PROGRESSION</p>

              <div className="flex items-end justify-between mt-1">      </div>              <h2 className="mt-1 text-2xl font-semibold text-neutral-900">{nextStop.client}</h2>

                <p className="text-2xl font-bold text-neutral-900">Arrêt {deliveredCount + 1} sur {totalStops}</p>

                <p className="text-brand-500 font-semibold">{progress}% terminé</p>    );              <p className="text-neutral-600">{nextStop.address}</p>

              </div>

              <div className="mt-3 h-2 bg-neutral-200 rounded-full overflow-hidden">  }              <p className="text-sm text-neutral-500">{nextStop.contact}</p>

                <div 

                  className="h-full bg-brand-500 rounded-full transition-all duration-500"            </div>

                  style={{ width: `${progress}%` }}

                ></div>  return (            <div className="flex items-center gap-3">

              </div>

            </div>    <div className="min-h-screen bg-neutral-50 flex flex-col">              <Badge variant="success">ETA {nextStop.eta}</Badge>



            {/* Current Stop Section */}      {/* Header */}              <Badge variant="info">{nextStop.distance}</Badge>

            {currentStop && (

              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-100">              <Badge variant="neutral">Créneau {nextStop.slot}</Badge>

                <div className="p-4 border-b border-neutral-100">

                  <div className="flex items-start justify-between">        <div className="flex items-center gap-3">            </div>

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center">          <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center overflow-hidden">          </div>

                        <span className="text-white font-bold">{currentStop.sequence}</span>

                      </div>            <span className="text-white font-bold text-lg">

                      <div>

                        <p className="text-xs text-brand-500 font-medium uppercase">Arrêt actuel</p>              {user.username?.charAt(0).toUpperCase() || "D"}          <div className="mt-5 grid gap-4 md:grid-cols-3">

                        <p className="font-semibold text-neutral-900">{currentStop.tracking_no}</p>

                      </div>            </span>            <div className="md:col-span-2 space-y-4">

                    </div>

                    {currentStop.distance_km && (          </div>              <div className="grid gap-4 sm:grid-cols-2">

                      <span className="px-2 py-1 bg-accent-100 text-accent-700 text-xs font-medium rounded-full">

                        {currentStop.distance_km.toFixed(1)} km          <div>                <Card className="p-4">

                      </span>

                    )}            <p className="font-semibold text-neutral-900">Hello, {user.username?.split("@")[0] || "Driver"}</p>                  <p className="text-sm uppercase tracking-wide text-neutral-500">Statut colis</p>

                  </div>

                </div>            <p className="text-xs text-neutral-500">DRIVER #{user.id}</p>                  <p className="text-lg font-semibold text-neutral-900">{nextStop.parcelId}</p>

                

                <div className="p-4">          </div>                  <p className="text-neutral-600">Remettre en main propre.</p>

                  <p className="text-neutral-800">{currentStop.address}</p>

                </div>        </div>                </Card>



                {/* Navigation Buttons */}        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-200">                <Card className="p-4">

                <div className="p-4 bg-neutral-50 border-t border-neutral-100 space-y-3">

                  <div className="grid grid-cols-2 gap-3">          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>                  <p className="text-sm uppercase tracking-wide text-neutral-500">Pré-brief client</p>

                    <button

                      onClick={() => handleOpenNavigation("google")}          <span className="text-sm font-medium text-neutral-700">Route Active</span>                  <p className="text-neutral-700">Mentionner contrôle d’identité et signature.</p>

                      className="flex items-center justify-center gap-2 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-700 font-medium hover:bg-neutral-50"

                    >        </div>                  <p className="text-sm text-neutral-500">Prévenir à l’arrivée : {nextStop.contact}</p>

                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">

                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>      </header>                </Card>

                      </svg>

                      Google Maps              </div>

                    </button>

                    <button      {/* Main Content */}

                      onClick={() => handleOpenNavigation("waze")}

                      className="flex items-center justify-center gap-2 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-700 font-medium hover:bg-neutral-50"      <main className="flex-1 overflow-auto px-4 py-4 space-y-4 pb-20">              <div className="flex flex-wrap gap-3">

                    >

                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">        {/* Progress Card */}                <Button className="px-5 py-3" onClick={() => handleOpenNavigation("google")}>

                        <path d="M20.54 6.63c-.46-2.6-2.57-4.6-5.18-5.06C13.21 1.23 11 1.23 8.65 1.57c-2.61.46-4.6 2.57-5.06 5.18-.34 2.35-.34 4.56 0 6.91.46 2.61 2.57 4.6 5.18 5.06 2.35.34 4.56.34 6.91 0 2.61-.46 4.6-2.57 5.06-5.18.34-2.35.34-4.56 0-6.91zM9 11c-.83 0-1.5-.67-1.5-1.5S8.17 8 9 8s1.5.67 1.5 1.5S9.83 11 9 11zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 8 15 8s1.5.67 1.5 1.5S15.83 11 15 11z"/>

                      </svg>        <div className="bg-neutral-100 rounded-2xl p-4">                  Ouvrir Google Maps

                      Waze

                    </button>          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">OVERALL PROGRESS</p>                </Button>

                  </div>

                            <div className="flex items-end justify-between mt-1">                <Button

                  <button

                    onClick={handleMarkDelivered}            <p className="text-2xl font-bold text-neutral-900">Stop {deliveredCount + 1} of {totalStops}</p>                  variant="secondary"

                    className="w-full py-4 bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-600"

                  >            <p className="text-brand-500 font-semibold">{progress}% Done</p>                  className="px-5 py-3"

                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />          </div>                  onClick={() => handleOpenNavigation("waze")}

                    </svg>

                    Marquer comme livré          <div className="mt-3 h-2 bg-neutral-200 rounded-full overflow-hidden">                >

                  </button>

                </div>            <div                   Ouvrir Waze

              </div>

            )}              className="h-full bg-brand-500 rounded-full transition-all duration-500"                </Button>



            {/* Upcoming Stops */}              style={{ width: `${progress}%` }}                <Button variant="outline" className="px-5 py-3">

            {upcomingStops.length > 0 && (

              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">            ></div>                  Signaler un incident

                <div className="p-4 border-b border-neutral-100">

                  <h3 className="font-semibold text-neutral-900">Prochains arrêts ({upcomingStops.length})</h3>          </div>                </Button>

                </div>

                <div className="divide-y divide-neutral-100">        </div>              </div>

                  {upcomingStops.slice(0, 5).map((stop) => (

                    <div key={stop.parcel_id} className="p-4 flex items-center gap-3">            </div>

                      <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium text-neutral-600">

                        {stop.sequence}        {/* Current Stop Section */}

                      </div>

                      <div className="flex-1 min-w-0">        {currentStop && (            <div>

                        <p className="text-sm font-medium text-neutral-900 truncate">{stop.tracking_no}</p>

                        <p className="text-xs text-neutral-500 truncate">{stop.address}</p>          <>              <Card className="h-full p-4">

                      </div>

                      {stop.distance_km && (            <div className="flex items-center justify-between">                <p className="text-sm uppercase tracking-wide text-neutral-500">Étapes restantes</p>

                        <span className="text-xs text-neutral-500">{stop.distance_km.toFixed(1)} km</span>

                      )}              <h2 className="text-lg font-semibold text-neutral-900">Current Stop</h2>                <div className="mt-3 space-y-3">

                    </div>

                  ))}              {currentStop.priority === "high" && (                  {upcomingStops.map((stop) => (

                </div>

              </div>                <span className="px-2.5 py-1 bg-brand-500 text-white text-xs font-semibold rounded-full uppercase">                    <div key={stop.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">

            )}

          </>                  Priority                      <div className="flex items-center justify-between text-sm font-semibold text-neutral-900">

        )}

      </main>                </span>                        <span>{stop.id}</span>



      {/* Bottom Navigation */}              )}                        <span className="text-xs text-neutral-500">{stop.eta}</span>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 px-6 py-2 flex items-center justify-around">

        <button className="flex flex-col items-center gap-1 py-2 text-brand-500">            </div>                      </div>

          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />                      <p className="text-sm text-neutral-700">{stop.address}</p>

          </svg>

          <span className="text-xs font-medium">Route</span>            <div className="bg-white rounded-2xl border-2 border-brand-500 p-4 shadow-sm">                      <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">

        </button>

        <button className="flex flex-col items-center gap-1 py-2 text-neutral-400">              <div className="flex items-center gap-2 mb-3">                        <Badge variant={stop.priority === "Haute" ? "danger" : "neutral"}>{stop.distance}</Badge>

          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />                <span className="px-2.5 py-1 bg-neutral-900 text-white text-xs font-semibold rounded">                        <span>{stop.priority}</span>

          </svg>

          <span className="text-xs">Colis</span>                  STOP {currentStop.id}                      </div>

        </button>

        <button className="flex flex-col items-center gap-1 py-2 text-neutral-400">                </span>                    </div>

          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />                <span className="text-brand-500 font-semibold text-sm">                  ))}

          </svg>

          <span className="text-xs">Profil</span>                  {currentStop.parcelCount} PARCELS                </div>

        </button>

      </nav>                </span>              </Card>

    </div>

  );              </div>            </div>

}

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
