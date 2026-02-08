import { useState, useEffect } from 'react';
import { Download, Trash2, Filter } from 'lucide-react';
import { registrosAPI, empresasAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';

export default function RegistrosPage() {
  const [registros, setRegistros] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ fechaInicio: '', fechaFin: '', empresa: '', vehiculo: '', tabla: '', horaInicio: '', horaFin: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const toast = useToast();

  useEffect(() => { loadData(); }, [pagination.page, filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [registrosRes, empresasRes] = await Promise.all([
        registrosAPI.getAll({ 
          page: pagination.page,
          limit: pagination.limit,
          fechaInicio: filters.fechaInicio,
          fechaFin: filters.fechaFin,
          empresa: filters.empresa,
          vehiculo: filters.vehiculo,
          tabla: filters.tabla,
          horaInicio: filters.horaInicio,
          horaFin: filters.horaFin
        }),
        empresasAPI.getAll(),
      ]);
      setRegistros(registrosRes.data || []);
      setEmpresas(empresasRes.data || []);
      if (registrosRes.pagination) {
        setPagination(registrosRes.pagination);
      }
    } catch (error) {
      toast.error('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;
    try {
      await registrosAPI.delete(id);
      toast.success('Éxito', 'Registro eliminado');
      loadData();
    } catch (error) {
      toast.error('Error', error.message);
    }
  };

  const exportToCSV = () => {
    if (registros.length === 0) {
      toast.error('Error', 'No hay datos para exportar');
      return;
    }
    const headers = ['Fecha', 'Vehículo', 'Tabla', 'Hora Inicio', 'Hora Fin', 'Servicio', 'Observaciones'];
    const csvContent = [
      headers.join(','),
      ...registros.map(r => [
        r.fecha, r.vehiculo, r.tabla, r.hora_inicio, r.hora_fin,
        `"${(r.servicio || '').replace(/"/g, '""')}"`,
        `"${(r.observaciones || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `registros_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Éxito', 'Archivo exportado');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString.split('T')[0]);
      return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const filteredRegistros = registros.filter(r => {
    if (filters.fechaInicio && r.fecha < filters.fechaInicio) return false;
    if (filters.fechaFin && r.fecha > filters.fechaFin) return false;
    if (filters.empresa && r.empresa_id !== parseInt(filters.empresa)) return false;
    if (filters.vehiculo && !r.vehiculo.toLowerCase().includes(filters.vehiculo.toLowerCase())) return false;
    if (filters.tabla && !r.tabla.toLowerCase().includes(filters.tabla.toLowerCase())) return false;
    if (filters.horaInicio && r.hora_inicio < filters.horaInicio) return false;
    if (filters.horaFin && r.hora_fin > filters.horaFin) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold">Registros de Conductores</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" /> Filtros
          </Button>
          <Button onClick={exportToCSV}>
            <Download className="w-4 h-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="glass-card rounded-xl p-4 animate-slideIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Fecha Inicio</label>
              <input type="date" value={filters.fechaInicio} onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })} className="w-full px-3 py-2 rounded-lg input-dark" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Fecha Fin</label>
              <input type="date" value={filters.fechaFin} onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })} className="w-full px-3 py-2 rounded-lg input-dark" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Empresa</label>
              <select value={filters.empresa} onChange={(e) => setFilters({ ...filters, empresa: e.target.value })} className="w-full px-3 py-2 rounded-lg input-dark">
                <option value="">Todas</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Vehículo</label>
              <input type="text" value={filters.vehiculo} onChange={(e) => setFilters({ ...filters, vehiculo: e.target.value })} placeholder="Ej: BUS-001" className="w-full px-3 py-2 rounded-lg input-dark" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Tabla</label>
              <input type="text" value={filters.tabla} onChange={(e) => setFilters({ ...filters, tabla: e.target.value })} placeholder="Ej: T01" className="w-full px-3 py-2 rounded-lg input-dark" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Hora Inicio</label>
              <input type="time" value={filters.horaInicio} onChange={(e) => setFilters({ ...filters, horaInicio: e.target.value })} className="w-full px-3 py-2 rounded-lg input-dark" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Hora Fin</label>
              <input type="time" value={filters.horaFin} onChange={(e) => setFilters({ ...filters, horaFin: e.target.value })} className="w-full px-3 py-2 rounded-lg input-dark" />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="ghost" size="sm" onClick={() => { setFilters({ fechaInicio: '', fechaFin: '', empresa: '', vehiculo: '', tabla: '', horaInicio: '', horaFin: '' }); setPagination({...pagination, page: 1}); }}>
              Limpiar filtros
            </Button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Fecha</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Vehículo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Empresa</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Tabla</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Ruta</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Conductor</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Horario</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase"># Servicios</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Novedad</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="10" className="px-6 py-8 text-center text-slate-500">Cargando...</td></tr>
              ) : filteredRegistros.length === 0 ? (
                <tr><td colSpan="10" className="px-6 py-8 text-center text-slate-500">No hay registros</td></tr>
              ) : (
                filteredRegistros.map((item) => (
                  <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm">{formatDate(item.fecha)}</td>
                    <td className="px-6 py-4 font-medium">{item.vehiculo}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{item.empresa_nombre || '-'}</td>
                    <td className="px-6 py-4 text-slate-400">{item.tabla}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{item.ruta_nombre || '-'}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{item.conductor_nombre || '-'}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{item.hora_inicio} - {item.hora_fin}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm font-medium">{item.servicio || '-'}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm max-w-37.5 truncate">{item.novedad_nombre || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer con contador y paginación */}
        <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between text-sm text-slate-500">
          <span>Mostrando {filteredRegistros.length} de {pagination.total} registros</span>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPagination({...pagination, page: pagination.page - 1})}
              disabled={pagination.page === 1}
            >
              Anterior
            </Button>
            <span className="px-3 py-1 text-slate-400">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPagination({...pagination, page: pagination.page + 1})}
              disabled={pagination.page === pagination.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
