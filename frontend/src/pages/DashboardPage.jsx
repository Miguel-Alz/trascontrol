import { useState, useEffect } from 'react';
import { FileText, Users, AlertTriangle, Truck, TrendingUp } from 'lucide-react';
import { statsAPI } from '../services/api';
import StatCard from '../components/ui/StatCard';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    registros: 0,
    conductores: 0,
    empresas: 0,
    novedades: 0,
    registrosPorEmpresa: [],
    registrosPorNovedad: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await statsAPI.getDashboard();
      if (response.success) {
        setStats({
          registros: response.stats.registros,
          conductores: response.stats.conductores,
          empresas: response.stats.empresas,
          novedades: response.stats.novedades,
          registrosPorEmpresa: response.registrosPorEmpresa || [],
          registrosPorNovedad: response.registrosPorNovedad || [],
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString.split('T')[0]);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          value={isLoading ? '...' : stats.registros}
          label="Total Registros"
          color="primary"
        />
        <StatCard
          icon={Users}
          value={isLoading ? '...' : stats.conductores}
          label="Conductores"
          color="success"
        />
        <StatCard
          icon={Truck}
          value={isLoading ? '...' : stats.empresas}
          label="Empresas"
          color="info"
        />
        <StatCard
          icon={AlertTriangle}
          value={isLoading ? '...' : stats.novedades}
          label="Tipos de Novedades"
          color="warning"
        />
      </div>

      {/* Gráficos y Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registros por Empresa */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-lg">📊 Registros por Empresa</h3>
          </div>
          {isLoading ? (
            <div className="text-slate-400 text-sm">Cargando...</div>
          ) : stats.registrosPorEmpresa.length === 0 ? (
            <div className="text-slate-400 text-sm">Sin datos</div>
          ) : (
            <div className="space-y-3">
              {stats.registrosPorEmpresa.map((empresa, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-300">{empresa.nombre}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
                        style={{
                          width: `${Math.min((empresa.cantidad / Math.max(...stats.registrosPorEmpresa.map(e => e.cantidad))) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-300 w-8 text-right">{empresa.cantidad}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registros por Tipo de Novedad */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-lg">⚠️ Novedades Registradas</h3>
          </div>
          {isLoading ? (
            <div className="text-slate-400 text-sm">Cargando...</div>
          ) : stats.registrosPorNovedad.length === 0 ? (
            <div className="text-slate-400 text-sm">Sin datos</div>
          ) : (
            <div className="space-y-3">
              {stats.registrosPorNovedad.map((novedad, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: novedad.color }}
                    />
                    <span className="text-slate-300">{novedad.nombre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{
                          backgroundColor: novedad.color,
                          width: `${Math.min((novedad.cantidad / Math.max(...stats.registrosPorNovedad.map(n => n.cantidad))) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-300 w-6 text-right">{novedad.cantidad}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
