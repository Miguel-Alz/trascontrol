import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { conductoresAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

export default function ConductoresPage() {
  const [conductores, setConductores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', cedula: '', telefono: '', activo: true });
  const [isSaving, setIsSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const toast = useToast();

  useEffect(() => { loadData(); }, [pagination.page, search]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await conductoresAPI.getAll({ 
        page: pagination.page, 
        limit: pagination.limit,
        search 
      });
      setConductores(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      toast.error('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditing(item);
      setFormData({ nombre: item.nombre, cedula: item.cedula || '', telefono: item.telefono || '', activo: item.activo });
    } else {
      setEditing(null);
      setFormData({ nombre: '', cedula: '', telefono: '', activo: true });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre) {
      toast.error('Error', 'El nombre es requerido');
      return;
    }
    setIsSaving(true);
    try {
      if (editing) {
        await conductoresAPI.update(editing.id, formData);
        toast.success('Éxito', 'Conductor actualizado');
      } else {
        await conductoresAPI.create(formData);
        toast.success('Éxito', 'Conductor creado');
      }
      closeModal();
      loadData();
    } catch (error) {
      toast.error('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este conductor?')) return;
    try {
      await conductoresAPI.delete(id);
      toast.success('Éxito', 'Conductor eliminado');
      loadData();
    } catch (error) {
      toast.error('Error', error.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold">Gestión de Conductores</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" /> Filtros
          </Button>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4" /> Nuevo Conductor
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="glass-card rounded-xl p-4 animate-slideIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Buscar por nombre o cédula" 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPagination({...pagination, page: 1}); }} 
              placeholder="Ej: Juan, 12345678..." 
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPagination({...pagination, page: 1}); }}>
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Nombre</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Cédula</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Teléfono</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Estado</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Cargando...</td></tr>
              ) : conductores.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No hay conductores registrados</td></tr>
              ) : (
                conductores.map((item) => (
                  <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.nombre}</td>
                    <td className="px-6 py-4 text-slate-400">{item.cedula || '-'}</td>
                    <td className="px-6 py-4 text-slate-400">{item.telefono || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
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
        
        {/* Paginación */}
        <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between text-sm text-slate-500">
          <span>Mostrando {conductores.length} de {pagination.total} conductores</span>
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Editar Conductor' : 'Nuevo Conductor'}>
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="space-y-4">
              <Input label="Nombre Completo" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Juan Pérez" required />
              <Input label="Cédula" value={formData.cedula} onChange={(e) => setFormData({ ...formData, cedula: e.target.value })} placeholder="Ej: 12345678" />
              <Input label="Teléfono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="Ej: 3001234567" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500" />
                <span className="text-sm text-slate-400">Activo</span>
              </label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal} type="button">Cancelar</Button>
            <Button type="submit" isLoading={isSaving}>{editing ? 'Guardar Cambios' : 'Crear Conductor'}</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}
