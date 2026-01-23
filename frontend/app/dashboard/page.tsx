export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
      <p>Bienvenue sur l'interface d'administration.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Dispatch</h2>
          <p className="text-slate-600 mb-4">Gérer les chargements de colis et l'optimisation des tournées.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Accéder au Dispatch</button>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Tri (Sorting)</h2>
          <p className="text-slate-600 mb-4">Scanner les colis et assigner aux chauffeurs.</p>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">Accéder au Tri</button>
        </div>
      </div>
    </div>
  );
}
