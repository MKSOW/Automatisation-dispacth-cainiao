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
const StopDetailsView = ({ stop, onBack, onComplete, onNavigate }: { stop: OptimizedStop; onBack: () => void; onComplete: () => void; onNavigate: () => void }) => (
  <div className="flex flex-col h-full bg-neutral-50">
    {/* Header */}
    <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-100 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-neutral-600 hover:bg-neutral-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span className="font-bold text-green-900 bg-green-100 px-3 py-1 rounded-full text-xs">STOP {stop.sequence}</span>
        <button className="p-2 -mr-2 text-neutral-400">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </button>
    </div>

    <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Address Header */}
        <div>
            <h1 className="text-2xl font-bold text-neutral-900 leading-tight mb-2">{stop.address}</h1>
            <div className="flex items-center text-neutral-500 gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{stop.distance_km?.toFixed(1)} km away</span>
            </div>
        </div>

        {/* Map Preview / Illustration */}
        <div className="bg-brand-50 rounded-xl border border-brand-100 p-6 flex items-center justify-center h-48 relative overflow-hidden">
             
             <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="currentColor" className="text-brand-500"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
             </div>
             
             {/* Simple Phone UI Illustration - mimicking maquette */}
             <div className="relative bg-white w-24 h-40 rounded-lg border-4 border-neutral-800 shadow-xl flex flex-col items-center justify-center z-10">
                 <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center mb-2">
                    <div className="w-3 h-3 bg-brand-500 rounded-full animate-ping" />
                 </div>
                 <div className="space-y-1 w-full px-3">
                    <div className="h-1 bg-neutral-100 rounded w-full" />
                    <div className="h-1 bg-neutral-100 rounded w-3/4" />
                 </div>
             </div>
             <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-brand-400 rounded-full opacity-50 blur-xl" />
        </div>

        {/* Parcel Details */}
        <div className="space-y-4">
            <h3 className="font-bold text-neutral-900">Parcel Details</h3>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-brand-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <div className="flex-1">
                    <p className="font-bold text-neutral-900">Box - Medium</p>
                    <p className="text-sm text-neutral-500">{stop.tracking_no}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            </div>

             <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex items-center gap-4 opacity-50">
                <div className="w-12 h-12 bg-neutral-50 rounded-lg flex items-center justify-center text-neutral-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <div className="flex-1">
                    <p className="font-bold text-neutral-900">Envelope - Small</p>
                    <p className="text-sm text-neutral-500">Scanning required...</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-neutral-300" />
            </div>
        </div>
        
        {/* Driver Notes */}
        <div className="pt-2">
             <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <h3 className="font-bold text-neutral-500 text-sm uppercase tracking-wider">Driver Notes</h3>
             </div>
             <textarea 
                placeholder="Add notes specifically for this delivery..."
                className="w-full bg-white border border-neutral-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-500"
                rows={3}
             />
        </div>

        <div className="h-20" /> {/* Spacer */}
    </div>
    
    {/* Buttons Container */}
    <div className="bg-white p-4 border-t border-neutral-100 pb-8 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] space-y-3 z-10">
        <Button onClick={onNavigate} className="w-full bg-neutral-900 text-white hover:bg-black py-6 rounded-xl font-bold text-lg shadow-lg shadow-neutral-200">
            <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                Start Navigation
            </div>
        </Button>
        <Button onClick={onComplete} className="w-full bg-brand-500 text-white hover:bg-brand-600 py-6 rounded-xl font-bold text-lg shadow-lg shadow-brand-200 border-none">
            <div className="flex items-center gap-3">
               <CheckIcon />
               Mark as Delivered
            </div>
        </Button>
    </div>
  </div>
);

export default function DriverRoutePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  // State
  const [view, setView] = useState<"route" | "map" | "parcels" | "profile">("route");
  const [selectedStop, setSelectedStop] = useState<OptimizedStop | null>(null); // For detail view state

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
      router.push("/login"); // Fixed: was using push inside effect without dependency
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
  
  // Progress calc
  const progressPercent = useMemo(() => {
      if (stops.length === 0) return 0;
      return Math.round((currentIndex / stops.length) * 100);
  }, [stops.length, currentIndex]);

  const handleMarkDelivered = () => {
    if (currentIndex < stops.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedStop(null); // Close detail view if open
    }
  };

  const moveStop = (idx: number, direction: -1 | 1) => {
    // Only allow reordering UPCOMING stops
    const newIndex = idx + direction;
    if (newIndex <= currentIndex || newIndex >= stops.length) return; 
    
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

  const mapParcels = useMemo<LiveParcel[]>(() => {
    return stops.map(s => ({
      id: s.parcel_id,
      tracking_no: s.tracking_no,
      address: s.address,
      driver_id: user?.id || 0,
      status: 'pending', 
      latitude: s.latitude, 
      longitude: s.longitude
    }));
  }, [stops, user]);

  if (isLoading || !user) return <div className="h-screen flex items-center justify-center bg-neutral-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent" /></div>;

  // Render Detached Stop Detail View (Modal-like)
  if (selectedStop) {
      return (
          <StopDetailsView 
            stop={selectedStop} 
            onBack={() => setSelectedStop(null)}
            onComplete={handleMarkDelivered}
            onNavigate={() => handleOpenNavigation('google', selectedStop)}
          />
      );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50 font-sans">
      {/* HEADER / TOP BAR in Map view it might overlay */}
      {view !== 'map' && (
        <header className="bg-white px-5 py-4 flex items-center justify-between border-b border-neutral-100 z-10">
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-brand-100 border-2 border-brand-500 overflow-hidden relative">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="Driver" className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <h1 className="text-lg font-bold text-neutral-900 leading-none mb-0.5">Hello, {user.username}</h1>
                    <p className="text-xs text-neutral-400 font-medium">DRIVER #{user.id} <span className="text-brand-300 mx-1">•</span> <span className="text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">Active Route</span></p>
                 </div>
            </div>
        </header>
      )}

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {loading && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent" />
             </div>
        )}

        {view === 'map' ? (
            <div className="flex-1 relative w-full h-full">
                <LiveFleetMap parcels={mapParcels} />
                
                {/* Floating Top Card */}
                <div className="absolute top-4 left-4 right-4 z-[400]">
                    <Card className="p-3 shadow-lg flex items-center justify-between bg-white/95 backdrop-blur">
                        <div>
                             <p className="text-xs font-bold text-neutral-800">Stop {currentIndex + 1} of {stops.length}</p>
                             <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{routeMeta.total_distance_km.toFixed(1)} km left</p>
                        </div>
                         <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs ring-4 ring-white">
                             {progressPercent}%
                         </div>
                    </Card>
                </div>

                {/* Floating Bottom Card */}
                {currentStop && (
                    <div className="absolute bottom-4 left-4 right-4 z-[400]">
                        <Card className="p-4 shadow-xl border-none">
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="inline-block bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase mb-1">Next Stop</span>
                                <h3 className="text-lg font-bold text-neutral-900 line-clamp-1">{currentStop.address}</h3>
                                <p className="text-sm text-neutral-500">{currentStop.tracking_no}</p>
                              </div>
                              <div className="flex flex-col items-end">
                                   <span className="text-xl font-bold text-neutral-900">~3 <span className="text-sm text-neutral-400 font-normal">mins</span></span>
                                   <span className="text-xs text-brand-600 font-medium">{currentStop.distance_km?.toFixed(1)} km</span>
                              </div>
                           </div>
                           <div className="grid grid-cols-[1fr_auto] gap-3">
                              <Button size="lg" onClick={() => handleOpenNavigation('google', currentStop)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                                    Start Navigation
                                </div>
                              </Button>
                              <Button size="lg" variant="secondary" onClick={() => setSelectedStop(currentStop)} className="bg-neutral-100 text-neutral-900 rounded-xl w-14 flex items-center justify-center">
                                <ListIcon />
                              </Button>
                           </div>
                        </Card>
                    </div>
                )}
            </div>
        ) : view === 'route' ? (
            <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-6">
                
                {/* Overall Progress */}
                <Card className="p-5 border-none shadow-sm bg-white">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Overall Progress</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-2xl font-bold text-neutral-900">Stop {currentIndex + 1} <span className="text-base text-neutral-400 font-normal">of {stops.length}</span></h2>
                            </div>
                        </div>
                        <span className="text-brand-500 font-bold">{progressPercent}% Done</span>
                    </div>
                    <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
                    </div>
                </Card>

                {/* Current Stop Hero Card */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-neutral-900">Current Stop</h3>
                        <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Priority</span>
                    </div>
                    
                    {currentStop ? (
                        <div 
                           className="bg-white rounded-2xl p-1 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-neutral-100 cursor-pointer transition-transform active:scale-[0.99]"
                           onClick={() => setSelectedStop(currentStop)}
                        >
                            <div className="p-5 pb-2 border-b border-neutral-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-brand-500 text-white font-bold text-xs px-2 py-1 rounded">STOP {currentStop.sequence}</span>
                                    <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">3 Parcels</span>
                                </div>
                                <h2 className="text-xl font-bold text-neutral-900 leading-snug mb-4">
                                    {currentStop.address}
                                </h2>
                                
                                <div className="h-32 bg-neutral-100 rounded-xl w-full overflow-hidden relative mb-4">
                                     <img src="https://assets.website-files.com/63a9fb837ebb681a30424597/63a9fb837ebb688173424606_Map.jpg" className="w-full h-full object-cover opacity-80 mix-blend-multiply" alt="Map Preview" />
                                     <div className="absolute inset-0 flex items-center justify-center">
                                         <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg transform -translate-y-1">
                                             <div className="w-3 h-3 bg-brand-500 rounded-full" />
                                         </div>
                                     </div>
                                </div>
                            </div>
                            <div className="p-3 flex gap-2">
                                <Button 
                                    className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-xl shadow-lg shadow-brand-100 border-none text-base"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenNavigation('google', currentStop);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                                        START NAVIGATION
                                    </div>
                                </Button>
                                <Button variant="secondary" className="w-14 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl" onClick={(e) => { e.stopPropagation(); /* Call */ }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl text-center border-2 border-dashed border-neutral-200">
                             <p className="text-neutral-400 font-medium">All stops completed!</p>
                        </div>
                    )}
                </div>

                {/* UPCOMING QUEUE */}
                <div>
                     <h3 className="font-bold text-lg text-neutral-900 mb-4">Upcoming Queue</h3>
                     <div className="space-y-3">
                         {upcomingStops.map((stop, i) => {
                             const idx = currentIndex + 1 + i + 1; // +1 for curr, +1 for 1-based
                             return (
                                 <div key={stop.parcel_id} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex items-center justify-between group active:scale-[0.98] transition-all">
                                     <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-700">
                                             {idx}
                                         </div>
                                         <div>
                                              <p className="font-bold text-neutral-900 text-sm line-clamp-1">{stop.address}</p>
                                              <p className="text-xs text-neutral-400 font-medium mt-0.5">1 PARCEL • PENDING</p>
                                         </div>
                                     </div>
                                     <svg className="text-neutral-300" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                 </div>
                             )
                         })}
                     </div>
                </div>

            </div>
        ) : null}
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="bg-white border-t border-neutral-100 px-6 py-3 flex justify-between items-center z-50 safe-area-bottom">
           <button 
             onClick={() => setView('route')}
             className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'route' ? 'text-brand-500' : 'text-neutral-400'}`}
           >
                <div className={`${view === 'route' ? 'bg-brand-50' : 'bg-transparent'} p-1.5 rounded-xl`}>
                    <ListIcon />
                </div>
                <span className="text-[10px] font-bold tracking-tight">ROUTE</span>
           </button>
           
           <button 
             onClick={() => setView('map')}
             className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'map' ? 'text-brand-500' : 'text-neutral-400'}`}
           >
                <div className={`${view === 'map' ? 'bg-brand-50' : 'bg-transparent'} p-1.5 rounded-xl`}>
                    <MapIcon />
                </div>
                <span className="text-[10px] font-bold tracking-tight">MAP</span>
           </button>

           <button 
             onClick={() => setView('parcels')}
             className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'parcels' ? 'text-brand-500' : 'text-neutral-400'}`}
           >
                <div className={`${view === 'parcels' ? 'bg-brand-50' : 'bg-transparent'} p-1.5 rounded-xl`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <span className="text-[10px] font-bold tracking-tight">PARCELS</span>
           </button>

           <button 
             onClick={() => setView('profile')}
             className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'profile' ? 'text-brand-500' : 'text-neutral-400'}`}
           >
                <div className={`${view === 'profile' ? 'bg-brand-50' : 'bg-transparent'} p-1.5 rounded-xl`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span className="text-[10px] font-bold tracking-tight">PROFILE</span>
           </button>
      </nav>
    </div>
  );
}

                 
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
