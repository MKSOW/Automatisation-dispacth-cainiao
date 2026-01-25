"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { getDriverRoute, OptimizedStop } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function DriverRoutePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [stops, setStops] = useState<OptimizedStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadRoute = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getDriverRoute(user.id);
      setStops(data);
      setCurrentIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "chauffeur") {
      router.push("/");
      return;
    }
    loadRoute();
  }, [user, isLoading, router, loadRoute]);

  const currentStop = stops[currentIndex] ?? null;
  const upcomingStops = useMemo(() => stops.slice(currentIndex + 1), [stops, currentIndex]);
  const deliveredCount = currentIndex;
  const totalStops = stops.length;
  const progress = totalStops > 0 ? Math.round((deliveredCount / totalStops) * 100) : 0;

  const handleMarkDelivered = () => {
    if (currentIndex < stops.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleOpenNavigation = (provider: "google" | "waze") => {
    if (!currentStop) return;
    const url = provider === "google" ? currentStop.google_maps_url : currentStop.waze_url;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center overflow-hidden">
            <span className="text-white font-bold text-lg">{user.username?.charAt(0).toUpperCase() || "D"}</span>
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Hello, {user.username || "Driver"}</p>
            <p className="text-xs text-neutral-500">DRIVER #{user.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-200">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-neutral-700">Route Active</span>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-4 py-4 space-y-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-danger-600 mb-4">{error}</p>
            <button onClick={loadRoute} className="px-4 py-2 bg-brand-500 text-white rounded-lg">
              Réessayer
            </button>
          </div>
        ) : stops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">Aucune tournée assignée pour aujourd&apos;hui</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="p-4 bg-neutral-100">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Progression</p>
              <div className="flex items-end justify-between mt-1">
                <h2 className="text-2xl font-semibold text-neutral-900">Arrêt {deliveredCount + 1} sur {totalStops}</h2>
                <p className="text-brand-500 font-semibold">{progress}% terminé</p>
              </div>
              <div className="mt-3 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </Card>

            {currentStop && (
              <Card className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-brand-500 font-medium uppercase">Arrêt actuel</p>
                    <p className="text-lg font-semibold text-neutral-900">{currentStop.tracking_no}</p>
                    <p className="text-neutral-700">{currentStop.address}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success">Sequence {currentStop.sequence}</Badge>
                    {currentStop.distance_km !== null && <Badge variant="neutral">{currentStop.distance_km.toFixed(1)} km</Badge>}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={() => handleOpenNavigation("google")} className="w-full justify-center">
                    Ouvrir Google Maps
                  </Button>
                  <Button variant="secondary" onClick={() => handleOpenNavigation("waze")} className="w-full justify-center">
                    Ouvrir Waze
                  </Button>
                </div>
                <Button className="w-full" onClick={handleMarkDelivered}>
                  Marquer comme livré
                </Button>
              </Card>
            )}

            {upcomingStops.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-neutral-900">Prochains arrêts ({upcomingStops.length})</h3>
                </div>
                <div className="divide-y divide-neutral-100">
                  {upcomingStops.map((stop) => (
                    <div key={stop.parcel_id} className="py-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium text-neutral-600">
                        {stop.sequence}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{stop.tracking_no}</p>
                        <p className="text-xs text-neutral-500 truncate">{stop.address}</p>
                      </div>
                      {stop.distance_km !== null && <span className="text-xs text-neutral-500">{stop.distance_km.toFixed(1)} km</span>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
