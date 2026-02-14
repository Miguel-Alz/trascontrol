import { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  AlertTriangle, 
  Truck, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar,
  Clock,
  Map,
  Award,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import StatCard from '../components/ui/StatCard';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];
const SEVERITY_COLORS = {
  critica: '#ef4444',
  alta: '#f97316',
  media: '#f59e0b',
  baja: '#22c55e'
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    registros: 0,
    conductores: 0,
    empresas: 0,
    novedades: 0,
    registrosPorEmpresa: [],
    registrosPorNovedad: [],
    registrosPorDia: [],
    registrosPorRuta: [],
    conductoresActivos: [],
    vehiculosMasUsados: [],
    horasPico: [],
    novedadesPorSeveridad: [],
    ultimosRegistros: []
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [companyPerformance, setCompanyPerformance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');

      const [dashboardRes, monthlyRes, performanceRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/stats/dashboard-advanced`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/stats/monthly-comparison`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/stats/company-performance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const dashboard = await dashboardRes.json();
      const monthly = await monthlyRes.json();
      const performance = await performanceRes.json();

      console.log('Dashboard response:', dashboard);
      console.log('registrosPorDia raw:', dashboard.registrosPorDia);

      if (dashboard.success) {
        setStats({
          registros: dashboard.stats?.registros || 0,
          conductores: dashboard.stats?.conductores || 0,
          empresas: dashboard.stats?.empresas || 0,
          novedades: dashboard.stats?.novedades || 0,
          registrosPorEmpresa: dashboard.registrosPorEmpresa || [],
          registrosPorNovedad: (dashboard.registrosPorNovedad || []).map(item => ({
            ...item,
            cantidad: parseInt(item.cantidad) || 0
          })),
          registrosPorDia: (dashboard.registrosPorDia || [])
            .map(item => ({
              ...item,
              total: parseInt(item.total) || 0,
              con_novedad: parseInt(item.con_novedad) || 0
            }))
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
          registrosPorRuta: dashboard.registrosPorRuta || [],
          conductoresActivos: dashboard.conductoresActivos || [],
          vehiculosMasUsados: dashboard.vehiculosMasUsados || [],
          horasPico: dashboard.horasPico || [],
          novedadesPorSeveridad: dashboard.novedadesPorSeveridad || [],
          ultimosRegistros: dashboard.ultimosRegistros || []
        });      
      }
      if (monthly.success) {
        setMonthlyData(monthly.data);
      }
      if (performance.success) {
        setCompanyPerformance(performance.data);
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
      // Tomar solo la parte de fecha (YYYY-MM-DD) y construir
      // la fecha como local para evitar el desfase UTC → Colombia
      const [year, month, day] = (dateString.split('T')[0]).split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short'
      });
    } catch {
      return '-';
    }
  };

  // Convierte "HH:MM" o "HH:MM:SS" (formato 24h de la BD) a "H:MM AM/PM"
  const formatTime = (timeString) => {
    if (!timeString) return '-';
    try {
      const [hStr, mStr] = timeString.split(':');
      const h = parseInt(hStr, 10);
      const m = mStr || '00';
      const suffix = h < 12 ? 'AM' : 'PM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${m} ${suffix}`;
    } catch {
      return timeString;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom label para el pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    if (percent < 0.05) return null; // No mostrar labels para segmentos muy pequeños
    
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    const nombre = stats.registrosPorNovedad[index]?.nombre || '';

    return (
      <text 
        x={x} 
        y={y} 
        fill="#e2e8f0" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm"
      >
        {`${nombre} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header con filtros */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard de Control</h1>
          <p className="text-slate-400 text-sm">Análisis y estadísticas en tiempo real</p>
        </div>
        
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === range
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {range === '7d' ? '7 días' : range === '30d' ? '30 días' : range === '90d' ? '90 días' : 'Todo'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          value={isLoading ? '...' : stats.stats?.registros || 0}
          label="Total Registros"
          color="primary"
        />
        <StatCard
          icon={Users}
          value={isLoading ? '...' : stats.stats?.conductores || 0}
          label="Conductores Activos"
          color="success"
        />
        <StatCard
          icon={Truck}
          value={isLoading ? '...' : stats.stats?.empresas || 0}
          label="Empresas"
          color="info"
        />
        <StatCard
          icon={AlertTriangle}
          value={isLoading ? '...' : stats.stats?.novedades || 0}
          label="Tipos de Novedades"
          color="warning"
        />
      </div>

      {/* Gráfico de Registros por Día */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-lg">Evolución de Registros (Últimos 30 días)</h3>
        </div>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center text-slate-400">
            Cargando gráfico...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={stats.registrosPorDia}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNovedad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="fecha" 
                stroke="#94a3b8"
                tickFormatter={formatDate}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total"
                connectNulls={true}
              />
              <Area 
                type="monotone" 
                dataKey="con_novedad" 
                stroke="#f59e0b" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNovedad)"
                name="Con Novedad"
                connectNulls={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Grid de Top Empresas y Distribución de Novedades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Empresas */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Truck className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-lg">Top Empresas</h3>
          </div>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center text-slate-400">Cargando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.registrosPorEmpresa || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis 
                  dataKey="nombre" 
                  type="category" 
                  stroke="#94a3b8"
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Registros" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribución de Novedades - CORREGIDO */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-lg">Distribución de Novedades</h3>
          </div>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center text-slate-400">Cargando...</div>
          ) : stats.registrosPorNovedad && stats.registrosPorNovedad.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={stats.registrosPorNovedad}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cantidad"
                  nameKey="nombre"
                >
                  {stats.registrosPorNovedad.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-400">
              No hay datos de novedades disponibles
            </div>
          )}
        </div>
      </div>

      {/* Grid de Gráficos Pequeños */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Horas Pico */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Horas Pico</h3>
          </div>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-slate-400">Cargando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.horasPico || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="hora" 
                  stroke="#94a3b8"
                  tickFormatter={(value) => {
                    const h = parseInt(value, 10);
                    if (isNaN(h)) return value;
                    const suffix = h < 12 ? 'AM' : 'PM';
                    const h12 = h % 12 === 0 ? 12 : h % 12;
                    return `${h12} ${suffix}`;
                  }}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  content={<CustomTooltip />}
                  labelFormatter={(value) => {
                    const h = parseInt(value, 10);
                    if (isNaN(h)) return value;
                    const suffix = h < 12 ? 'AM' : 'PM';
                    const h12 = h % 12 === 0 ? 12 : h % 12;
                    return `${h12}:00 ${suffix}`;
                  }}
                />
                <Bar dataKey="cantidad" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Registros" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Rutas */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Map className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold">Top Rutas</h3>
          </div>
          {isLoading ? (
            <div className="text-slate-400 text-sm">Cargando...</div>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {(stats.registrosPorRuta || []).slice(0, 6).map((ruta, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm truncate">{ruta.nombre}</span>
                  <span className="text-blue-400 font-semibold text-sm ml-2">{ruta.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Novedades por Severidad */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold">Severidad</h3>
          </div>
          {isLoading ? (
            <div className="text-slate-400 text-sm">Cargando...</div>
          ) : (
            <div className="space-y-3">
              {(stats.novedadesPorSeveridad || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: SEVERITY_COLORS[item.severidad] }}
                    />
                    <span className="text-slate-300 text-sm capitalize">{item.severidad}</span>
                  </div>
                  <span className="text-slate-300 font-semibold text-sm">{item.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conductores y Vehículos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Conductores */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-lg">Conductores Más Activos</h3>
          </div>
          {isLoading ? (
            <div className="text-slate-400 text-sm">Cargando...</div>
          ) : (
            <div className="space-y-3">
              {(stats.conductoresActivos || []).slice(0, 5).map((conductor, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-slate-200 font-medium">{conductor.nombre}</p>
                    <p className="text-slate-400 text-xs">CC: {conductor.cedula}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-semibold">{conductor.total_registros}</p>
                    <p className="text-amber-400 text-xs">{conductor.con_novedades} nov.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehículos Más Usados */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-lg">Vehículos Más Usados</h3>
          </div>
          {isLoading ? (
            <div className="text-slate-400 text-sm">Cargando...</div>
          ) : (
            <div className="space-y-3">
              {(stats.vehiculosMasUsados || []).slice(0, 5).map((vehiculo, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-slate-200 font-medium">{vehiculo.vehiculo}</p>
                    <p className="text-slate-400 text-xs">{vehiculo.con_novedades} con novedades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-semibold">{vehiculo.cantidad}</p>
                    <p className="text-slate-400 text-xs">usos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimos Registros */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-pink-400" />
          <h3 className="font-semibold text-lg">Últimos Registros</h3>
        </div>
        {isLoading ? (
          <div className="text-slate-400 text-sm">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">Fecha</th>
                  <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">Empresa</th>
                  <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">Conductor</th>
                  <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">Vehículo</th>
                  <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">Novedad</th>
                </tr>
              </thead>
              <tbody>
                {(stats.ultimosRegistros || []).map((registro) => (
                  <tr key={registro.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-300 text-sm">
                      {formatDate(registro.fecha)}
                      <span className="text-slate-500 ml-2">{formatTime(registro.hora_inicio)}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-sm">{registro.empresa}</td>
                    <td className="py-3 px-4 text-slate-300 text-sm">{registro.conductor || '-'}</td>
                    <td className="py-3 px-4 text-slate-300 text-sm">{registro.vehiculo}</td>
                    <td className="py-3 px-4">
                      {registro.novedad ? (
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: `${registro.color}20`,
                            color: registro.color
                          }}
                        >
                          {registro.novedad}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}