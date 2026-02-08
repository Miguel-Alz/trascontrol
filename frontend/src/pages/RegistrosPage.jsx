import { useState, useEffect } from 'react';
import { Download, Trash2, Filter, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { registrosAPI, empresasAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';

const SEVERITY_COLORS = {
  critica: '#ef4444',
  alta: '#f97316',
  media: '#f59e0b',
  baja: '#22c55e'
};

export default function RegistrosPage() {
  const [registros, setRegistros] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filters, setFilters] = useState({ fechaInicio: '', fechaFin: '', empresa: '', vehiculo: '', tabla: '', horaInicio: '', horaFin: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [searchTerms, setSearchTerms] = useState({ empresa: '' });
  const [dropdowns, setDropdowns] = useState({ empresa: false });
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

  const getAllFilteredRegistros = async () => {
    try {
      const response = await registrosAPI.getAll({ 
        page: 1,
        limit: 999999,
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
        empresa: filters.empresa,
        vehiculo: filters.vehiculo,
        tabla: filters.tabla,
        horaInicio: filters.horaInicio,
        horaFin: filters.horaFin
      });
      return response.data || [];
    } catch (error) {
      toast.error('Error', 'No se pudieron obtener los registros para exportar');
      return [];
    }
  };

  const exportToCSV = async (registrosToExport) => {
    if (registrosToExport.length === 0) {
      toast.error('Error', 'No hay datos para exportar');
      return;
    }
    const headers = ['Fecha', 'Vehículo', 'Tabla', 'Hora Inicio', 'Hora Fin', 'Servicio', 'Observaciones'];
    const csvContent = [
      headers.join(','),
      ...registrosToExport.map(r => [
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
    toast.success('Éxito', 'Archivo CSV exportado');
  };

  const exportToXLSX = async (registrosToExport) => {
    if (registrosToExport.length === 0) {
      toast.error('Error', 'No hay datos para exportar');
      return;
    }

    const headers = ['Fecha', 'Vehículo', 'Empresa', 'Tabla', 'Ruta', 'Conductor', 'Hora Inicio', 'Hora Fin', '# Servicios', 'Novedad'];
    const data = registrosToExport.map(r => [
      r.fecha,
      r.vehiculo,
      r.empresa_nombre || '-',
      r.tabla,
      r.ruta_nombre || '-',
      r.conductor_nombre || '-',
      r.hora_inicio,
      r.hora_fin,
      r.servicio || '-',
      r.novedad_nombre || '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 8 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registros');
    XLSX.writeFile(wb, `registros_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Éxito', 'Archivo XLSX exportado');
  };

  const handleExport = async (format) => {
    const registrosToExport = await getAllFilteredRegistros();
    
    if (format === 'csv') {
      await exportToCSV(registrosToExport);
    } else if (format === 'xlsx') {
      await exportToXLSX(registrosToExport);
    }
    
    setShowExportModal(false);
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

  const selectEmpresa = (empresa) => {
    setFilters({ ...filters, empresa: empresa.id });
    setSearchTerms({ ...searchTerms, empresa: empresa.nombre });
    setDropdowns({ ...dropdowns, empresa: false });
  };

  const filteredEmpresas = empresas.filter(e => e.nombre.toLowerCase().includes(searchTerms.empresa.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold">Registros de Conductores</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" /> Filtros
          </Button>
          <Button onClick={() => setShowExportModal(true)}>
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
              <div className="relative">
                <input
                  type="text"
                  value={searchTerms.empresa}
                  onChange={(e) => { setSearchTerms({ ...searchTerms, empresa: e.target.value }); setDropdowns({ ...dropdowns, empresa: true }); }}
                  onFocus={() => setDropdowns({ ...dropdowns, empresa: true })}
                  className="w-full px-4 py-2.5 rounded-lg input-dark"
                  placeholder="Buscar empresa..."
                />
                {dropdowns.empresa && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-auto">
                    <button type="button" onClick={() => { setFilters({ ...filters, empresa: '' }); setSearchTerms({ ...searchTerms, empresa: '' }); setDropdowns({ ...dropdowns, empresa: false }); }} className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors text-slate-300">
                      Todas
                    </button>
                    {filteredEmpresas.length === 0 ? (
                      <div className="p-3 text-slate-500 text-sm">No hay resultados</div>
                    ) : (
                      filteredEmpresas.map(e => (
                        <button key={e.id} type="button" onClick={() => selectEmpresa(e)} className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors">
                          <div className="font-medium">{e.nombre}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Vehículo</label>
              <input type="text" value={filters.vehiculo} onChange={(e) => setFilters({ ...filters, vehiculo: e.target.value })} placeholder="Ej: BUS-001" className="w-full px-3 py-2 rounded-lg input-dark" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Tabla</label>
              <input type="text" value={filters.tabla} onChange={(e) => setFilters({ ...filters, tabla: e.target.value })} placeholder="Ej: 1, 2..." className="w-full px-3 py-2 rounded-lg input-dark" />
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

      {/* Modal de Exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card rounded-xl p-6 max-w-sm w-full mx-4 animate-slideIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Seleccionar formato de exportación</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Se exportarán todos los registros que coincidan con los filtros activos
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="secondary"
                onClick={() => handleExport('csv')}
                className="flex flex-col items-center gap-2"
              >
                <Download className="w-5 h-5" />
                CSV
              </Button>
              <Button 
                onClick={() => handleExport('xlsx')}
                className="flex flex-col items-center gap-2"
              >
                <Download className="w-5 h-5" />
                XLSX
              </Button>
            </div>
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
                    <td className="px-6 py-4 text-sm max-w-37.5">
                      {item.novedad_nombre ? (
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium inline-block"
                          style={{ 
                            backgroundColor: `${item.color || '#94a3b8'}20`,
                            color: item.color || '#94a3b8'
                          }}
                        >
                          {item.novedad_nombre}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm">-</span>
                      )}
                    </td>
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
