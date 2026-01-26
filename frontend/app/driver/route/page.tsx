"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { getDriverRoute, reorderDriverRoute, OptimizedStop, OptimizedRoute } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LiveParcel } from "@/components/live-fleet-map";

// Dynamic import for Map to avoid SSR issues
const LiveFleetMap = dynamic(() => import("@/components/live-fleet-map"), { ssr: false });

// Simple Icons
const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" x2="8" y1="2" y2="18"/><line x1="16" x2="16" y1="6" y2="22"/></svg>
);
const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
);
const NavIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
);
const CheckIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

export default function DriverRoutePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  // State
  const [view, setView] = useState<"list" | "map">("list");
  const [stops, setStops] = useState<OptimizedStop[]>([]);
  const [routeMeta, setRouteMeta] = useState<{ total_distance_km: number; total_duration_min: number | null }>({ total_distance_km: 0, total_duration_min: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0); // Which stop is "active" (next to deliver)
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
      setCurrentIndex(0); // Could logic to find first non-delivered?
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
  const deliveredRef = useMemo(() => stops.slice(0, currentIndex), [stops, currentIndex]);

  const handleMarkDelivered = () => {
    if (currentIndex < stops.length) {
      // In a real app we'd call API to update status here
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const moveStop = (idx: number, direction: -1 | 1) => {
    // Only allow reordering UPCOMING stops (absolute index > currentIndex)
    // Actually current implementation reorders specific index
    // Let's keep it simple: Map relative index to absolute
    const newIndex = idx + direction;
    if (newIndex <= currentIndex || newIndex >= stops.length) return; // Can't move before current
    
    const copy = [...stops];
    const [item] = copy.splice(idx, 1);
    copy.splice(newIndex, 0, item);
    setStops(copy);
  };

  const handleSaveOrder = async () => {
    if (!user) return;
    try {
      setSavingOrder(true);
      const orderedIds = stops.map((s) => s.parcel_id);
      const updated = await reorderDriverRoute(user.id, orderedIds);
      setStops(updated.stops);
      setRouteMeta({ total_distance_km: updated.total_distance_km, total_duration_min: updated.total_duration_min });
      setReordering(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'ordre");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleOpenNavigation = (provider: "google" | "waze", stop: OptimizedStop) => {
    const url = provider === "google" ? stop.google_maps_url : stop.waze_url;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Adapter for LiveFleetMap
  const mapParcels = useMemo<LiveParcel[]>(() => {
    return stops.map(s => ({
      id: s.parcel_id,
      tracking_no: s.tracking_no,
      address: s.address, // Correct property name
      driver_id: user?.id || 0,
      status: 'pending', // TODO: use real status
      // Use the newly added fields
      latitude: s.latitude, 
      longitude: s.longitude
    }));
  }, [stops, user]);

  if (isLoading || !user) return <div className="h-screen flex items-center justify-center bg-neutral-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent" /></div>;

  return (
    <div className="h-screen flex flex-col bg-neutral-100">
      {/* HEADER */}
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-200 shadow-sm z-10">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-neutral-900 leading-tight">My Route</h1>
          <span className="text-xs text-neutral-500">
             {stops.length - currentIndex} stops remaining • {routeMeta.total_distance_km.toFixed(1)} km
          </span>
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-lg">
           <button 
             onClick={() => setView('list')}
             className={`p-2 rounded-md transition-all ${view === 'list' ? 'bg-white shadow-sm text-brand-600' : 'text-neutral-500 hover:text-neutral-700'}`}
           >
             <ListIcon />
           </button>
           <button 
             onClick={() => setView('map')}
             className={`p-2 rounded-md transition-all ${view === 'map' ? 'bg-white shadow-sm text-brand-600' : 'text-neutral-500 hover:text-neutral-700'}`}
           >
             <MapIcon />
           </button>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-hidden relative">
        {loading ? (
             <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
             </div>
        ) : null}

        {view === 'map' && (
            <div className="h-full w-full relative">
                <LiveFleetMap parcels={mapParcels} />
                {/* Floating Current Stop Card on Map */}
                {currentStop && (
                    <div className="absolute bottom-4 left-4 right-4 z-[400]">
                        <Card className="p-4 shadow-xl border-t-4 border-t-brand-500">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Next Stop #{currentStop.sequence}</span>
                                <h3 className="text-lg font-bold text-neutral-900 line-clamp-1">{currentStop.address}</h3>
                                <p className="text-sm text-neutral-500">{currentStop.tracking_no}</p>
                              </div>
                              <div className="bg-brand-50 text-brand-700 px-2 py-1 rounded text-xs font-bold">
                                {currentStop.distance_km?.toFixed(1)} km
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-2 mt-3">
                              <Button size="sm" onClick={() => handleOpenNavigation('google', currentStop)} className="w-full gap-2">
                                <NavIcon /> Go
                              </Button>
                              <Button size="sm" variant="secondary" onClick={handleMarkDelivered} className="w-full gap-2">
                                <CheckIcon /> Done
                              </Button>
                           </div>
                        </Card>
                    </div>
                )}
            </div>
        )}

        {view === 'list' && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
                {/* CURRENT STOP HERO */}
                {currentStop ? (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Current Stop</h2>
                            <span className="text-xs font-mono bg-neutral-200 px-2 py-0.5 rounded text-neutral-700">SEQ {currentStop.sequence}</span>
                        </div>
                        <Card className="overflow-hidden border-brand-200 shadow-md">
                            <div className="bg-brand-500 px-4 py-3 text-white flex justify-between items-center">
                                <span className="font-bold text-lg">#{currentIndex + 1}</span>
                                <span className="text-sm opacity-90">{currentStop.distance_km?.toFixed(1)} km away</span>
                            </div>
                            <div className="p-5">
                                <h3 className="text-xl font-bold text-neutral-900 mb-1">{currentStop.address}</h3>
                                <p className="text-neutral-500 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                                    {currentStop.tracking_no}
                                </p>
                                
                                <div className="grid gap-3">
                                    <Button onClick={() => handleOpenNavigation('google', currentStop)} className="w-full py-6 text-lg">
                                        <NavIcon />
                                        <span className="ml-2">Navigate</span>
                                    </Button>
                                    <Button onClick={handleMarkDelivered} variant="outline" className="w-full py-4 border-brand-200 text-brand-700 hover:bg-brand-50">
                                        <CheckIcon />
                                        <span className="ml-2">Mark as Delivered</span>
                                    </Button>
                                    <div className="flex justify-center mt-2">
                                       <button onClick={() => handleOpenNavigation('waze', currentStop)} className="text-xs text-neutral-400 underline hover:text-neutral-600">
                                         Use Waze instead
                                       </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-neutral-100">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckIcon />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900">All Delivered!</h2>
                        <p className="text-neutral-500">Good job today.</p>
                    </div>
                )}

                {/* UPCOMING LIST */}
                {upcomingStops.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3 sticky top-0 bg-neutral-100 py-2 z-10">
                            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Next ({upcomingStops.length})</h3>
                            <button 
                              onClick={() => setReordering(!reordering)} 
                              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                            >
                                {reordering ? "Done" : "Reorder"}
                            </button>
                        </div>
                        
                        <div className="space-y-3 pb-20">
                            {upcomingStops.map((stop, i) => {
                                const absIndex = currentIndex + 1 + i;
                                return (
                                    <Card key={stop.parcel_id} className="p-4 flex flex-col gap-3 border-l-4 border-l-neutral-300">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-500 text-sm">
                                                    {stop.sequence}
                                                 </div>
                                                 <div>
                                                     <p className="font-semibold text-neutral-900 line-clamp-2">{stop.address}</p>
                                                     <p className="text-xs text-neutral-400 mt-0.5">{stop.tracking_no}</p>
                                                 </div>
                                            </div>
                                            {stop.distance_km && (
                                                <span className="text-xs font-medium text-neutral-400 whitespace-nowrap">
                                                    {stop.distance_km.toFixed(1)} km
                                                </span>
                                            )}
                                        </div>
                                        
                                        {reordering ? (
                                             <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-neutral-100">
                                                <button onClick={() => moveStop(absIndex, -1)} className="p-2 bg-neutral-100 rounded text-neutral-600 hover:bg-neutral-200">↑</button>
                                                <button onClick={() => moveStop(absIndex, 1)} className="p-2 bg-neutral-100 rounded text-neutral-600 hover:bg-neutral-200">↓</button>
                                             </div>
                                        ) : (
                                            <div className="flex justify-end mt-1">
                                                <Button size="sm" variant="ghost" onClick={() => handleOpenNavigation('google', stop)} className="text-xs h-8">
                                                    View Map
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
                 
                 {reordering && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                        <Button onClick={handleSaveOrder} disabled={savingOrder} className="shadow-xl">
                            {savingOrder ? "Saving..." : "Save Route Order"}
                        </Button>
                    </div>
                 )}
            </div>
        )}
      </main>
    </div>
  );
}
