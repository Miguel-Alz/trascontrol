import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { empresasAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', prefijo: '', activo: true });
  const [isSaving, setIsSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const toast = useToast();

  useEffect(() => {
    loadEmpresas();
  }, [pagination.page, search]);

  const loadEmpresas = async () => {
    setIsLoading(true);
    try {
      const response = await empresasAPI.getAll({ 
        page: pagination.page, 
        limit: pagination.limit,
        search 
      });
      setEmpresas(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      toast.error('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (empresa = null) => {
    if (empresa) {
      setEditingEmpresa(empresa);
      setFormData({ nombre: empresa.nombre, prefijo: empresa.prefijo, activo: empresa.activo });
    } else {
      setEditingEmpresa(null);
      setFormData({ nombre: '', prefijo: '', activo: true });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEmpresa(null);
    setFormData({ nombre: '', prefijo: '', activo: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.prefijo) {
      toast.error('Error', 'Complete todos los campos');
      return;
    }

    setIsSaving(true);
    try {
      if (editingEmpresa) {
        await empresasAPI.update(editingEmpresa.id, formData);
        toast.success('Éxito', 'Empresa actualizada');
      } else {
        await empresasAPI.create(formData);
        toast.success('Éxito', 'Empresa creada');
      }
      closeModal();
      loadEmpresas();
    } catch (error) {
      toast.error('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta empresa?')) return;
    
    try {
      await empresasAPI.delete(id);
      toast.success('Éxito', 'Empresa eliminada');
      loadEmpresas();
    } catch (error) {
      toast.error('Error', error.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold">🏢 Gestión de Empresas</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" /> Filtros
          </Button>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4" />
            Nueva Empresa
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="glass-card rounded-xl p-4 animate-slideIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Buscar por nombre o prefijo" 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPagination({...pagination, page: 1}); }} 
              placeholder="Ej: Transperla, TP..." 
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Prefijo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Estado</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">Cargando...</td>
                </tr>
              ) : empresas.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No hay empresas registradas</td>
                </tr>
              ) : (
                empresas.map((empresa) => (
                  <tr key={empresa.id} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{empresa.nombre}</td>
                    <td className="px-6 py-4 text-slate-400">{empresa.prefijo}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        empresa.activo 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {empresa.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(empresa)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(empresa.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
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
          <span>Mostrando {empresas.length} de {pagination.total} empresas</span>
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

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}>
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="space-y-4">
              <Input
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Transperla del Otún"
                required
              />
              <Input
                label="Prefijo"
                value={formData.prefijo}
                onChange={(e) => setFormData({ ...formData, prefijo: e.target.value.toUpperCase() })}
                placeholder="Ej: TP"
                required
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-400">Activa</span>
              </label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal} type="button">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingEmpresa ? 'Guardar Cambios' : 'Crear Empresa'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}
