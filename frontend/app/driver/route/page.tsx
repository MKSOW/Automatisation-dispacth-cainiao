"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { getDriverRoute, reorderDriverRoute, OptimizedStop, OptimizedRoute } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function DriverRoutePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [stops, setStops] = useState<OptimizedStop[]>([]);
  const [routeMeta, setRouteMeta] = useState<{ total_distance_km: number; total_duration_min: number | null }>({ total_distance_km: 0, total_duration_min: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reordering, setReordering] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const loadRoute = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getDriverRoute(user.id);
      setStops(data.stops);
      setRouteMeta({ total_distance_km: data.total_distance_km, total_duration_min: data.total_duration_min });
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

  const moveStop = (idx: number, direction: -1 | 1) => {
    const newIndex = idx + direction;
    if (newIndex < 0 || newIndex >= stops.length) return;
    const copy = [...stops];
    const [item] = copy.splice(idx, 1);
    copy.splice(newIndex, 0, item);
    setStops(copy);
    setCurrentIndex(0); // reset progression after manual reorder
  };

  const handleSaveOrder = async () => {
    if (!user) return;
    try {
      setSavingOrder(true);
      const orderedIds = stops.map((s) => s.parcel_id);
      const updated = await reorderDriverRoute(user.id, orderedIds);
      setStops(updated.stops);
      setRouteMeta({ total_distance_km: updated.total_distance_km, total_duration_min: updated.total_duration_min });
      setCurrentIndex(0);
      setReordering(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'ordre");
    } finally {
      setSavingOrder(false);
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
            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Résumé tournée</p>
                  <h2 className="text-lg font-semibold text-neutral-900">{routeMeta.total_distance_km.toFixed(1)} km</h2>
                  {routeMeta.total_duration_min !== null && (
                    <p className="text-sm text-neutral-600">~{routeMeta.total_duration_min.toFixed(0)} min estimées</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setReordering((v) => !v)}>
                    {reordering ? "Annuler" : "Réordonner"}
                  </Button>
                  {reordering && (
                    <Button onClick={handleSaveOrder} disabled={savingOrder}>
                      {savingOrder ? "Sauvegarde..." : "Enregistrer"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>

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
                  {upcomingStops.map((stop, idx) => {
                    const absoluteIndex = currentIndex + 1 + idx;
                    return (
                      <div key={stop.parcel_id} className="py-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium text-neutral-600">
                          {absoluteIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{stop.tracking_no}</p>
                          <p className="text-xs text-neutral-500 truncate">{stop.address}</p>
                        </div>
                        {stop.distance_km !== null && <span className="text-xs text-neutral-500">{stop.distance_km.toFixed(1)} km</span>}
                        {reordering && (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveStop(absoluteIndex, -1)}
                              className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-xs"
                            >↑</button>
                            <button
                              onClick={() => moveStop(absoluteIndex, 1)}
                              className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-xs"
                            >↓</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
