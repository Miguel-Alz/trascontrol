import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, RotateCcw, User, Loader2 } from 'lucide-react';
import { empresasAPI, rutasAPI, conductoresAPI, novedadesAPI, registrosAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function FormularioPage() {
  const [empresas, setEmpresas] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [novedades, setNovedades] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    empresa_id: '',
    ruta_id: '',
    vehiculo: '',
    tabla: '',
    conductor_id: '',
    hora_inicio: '',
    hora_fin: '',
    servicio: '',
    tipo_novedad_id: '',
    observaciones: '',
  });

  const [searchTerms, setSearchTerms] = useState({ empresa: '', ruta: '', conductor: '' });
  const [dropdowns, setDropdowns] = useState({ empresa: false, ruta: false, conductor: false });

  useEffect(() => {
    loadData();
    // Hora actual redondeada a 15 minutos
    const now = new Date();
    const minutes = Math.round(now.getMinutes() / 15) * 15;
    const hora = `${String(now.getHours()).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, hora_inicio: hora }));
  }, []);

  const loadData = async () => {
    try {
      const [empRes, rutRes, condRes, novRes] = await Promise.all([
        empresasAPI.getAll(),
        rutasAPI.getAll(),
        conductoresAPI.getAll(),
        novedadesAPI.getAll(),
      ]);
      setEmpresas(empRes.data || []);
      setRutas(rutRes.data || []);
      setConductores(condRes.data || []);
      setNovedades(novRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.fecha || !formData.empresa_id || !formData.vehiculo || !formData.tabla || !formData.hora_inicio || !formData.hora_fin) {
      toast.error('Error', 'Complete todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      await registrosAPI.create({
        ...formData,
        empresa_id: parseInt(formData.empresa_id),
        ruta_id: formData.ruta_id ? parseInt(formData.ruta_id) : null,
        conductor_id: formData.conductor_id ? parseInt(formData.conductor_id) : null,
        tipo_novedad_id: formData.tipo_novedad_id ? parseInt(formData.tipo_novedad_id) : null,
      });
      setShowSuccess(true);
    } catch (error) {
      toast.error('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      empresa_id: '', ruta_id: '', vehiculo: '', tabla: '',
      conductor_id: '', hora_inicio: '', hora_fin: '', servicio: '',
      tipo_novedad_id: '', observaciones: '',
    });
    setSearchTerms({ empresa: '', ruta: '', conductor: '' });
    setShowSuccess(false);
  };

  const selectEmpresa = (empresa) => {
    setFormData({ ...formData, empresa_id: empresa.id });
    setSearchTerms({ ...searchTerms, empresa: empresa.nombre });
    setDropdowns({ ...dropdowns, empresa: false });
  };

  const selectRuta = (ruta) => {
    setFormData({ ...formData, ruta_id: ruta.id });
    setSearchTerms({ ...searchTerms, ruta: ruta.nombre });
    setDropdowns({ ...dropdowns, ruta: false });
  };

  const selectConductor = (conductor) => {
    setFormData({ ...formData, conductor_id: conductor.id });
    setSearchTerms({ ...searchTerms, conductor: conductor.nombre });
    setDropdowns({ ...dropdowns, conductor: false });
  };

  const filteredEmpresas = empresas.filter(e => e.nombre.toLowerCase().includes(searchTerms.empresa.toLowerCase()));
  const filteredRutas = rutas.filter(r => r.nombre.toLowerCase().includes(searchTerms.ruta.toLowerCase()));
  const filteredConductores = conductores.filter(c => c.nombre.toLowerCase().includes(searchTerms.conductor.toLowerCase()));

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-slideIn">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Registro Exitoso!</h2>
          <p className="text-slate-400 mb-6">La información ha sido guardada correctamente</p>
          <Button onClick={resetForm}>Nuevo Registro</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-xl">🚌</div>
            <div>
              <div className="font-semibold">TransControl</div>
              <div className="text-xs text-slate-400">Sistema de Registro</div>
            </div>
          </div>
          <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <User className="w-5 h-5" /> <span className="hidden sm:inline">Panel Admin</span>
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-card rounded-2xl p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-1">📋 Registro Diario</h1>
            <p className="text-slate-400 text-sm">Complete la información del servicio de transporte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Fecha */}
              <Input label="Fecha" type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required />

              {/* Empresa */}
              <div className="space-y-1 relative">
                <label className="block text-sm font-medium text-slate-400">Empresa <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={searchTerms.empresa}
                  onChange={(e) => { setSearchTerms({ ...searchTerms, empresa: e.target.value }); setDropdowns({ ...dropdowns, empresa: true }); }}
                  onFocus={() => setDropdowns({ ...dropdowns, empresa: true })}
                  className="w-full px-4 py-2.5 rounded-lg input-dark"
                  placeholder="Buscar empresa..."
                />
                {dropdowns.empresa && searchTerms.empresa && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-auto">
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

              {/* Ruta */}
              <div className="space-y-1 relative">
                <label className="block text-sm font-medium text-slate-400">Ruta</label>
                <input
                  type="text"
                  value={searchTerms.ruta}
                  onChange={(e) => { setSearchTerms({ ...searchTerms, ruta: e.target.value }); setDropdowns({ ...dropdowns, ruta: true }); }}
                  onFocus={() => setDropdowns({ ...dropdowns, ruta: true })}
                  className="w-full px-4 py-2.5 rounded-lg input-dark"
                  placeholder="Buscar ruta..."
                />
                {dropdowns.ruta && searchTerms.ruta && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-auto">
                    {filteredRutas.length === 0 ? (
                      <div className="p-3 text-slate-500 text-sm">No hay resultados</div>
                    ) : (
                      filteredRutas.map(r => (
                        <button key={r.id} type="button" onClick={() => selectRuta(r)} className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors">
                          <div className="font-medium">{r.nombre}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Vehículo */}
              <Input label="Vehículo" value={formData.vehiculo} onChange={(e) => setFormData({ ...formData, vehiculo: e.target.value })} placeholder="Ej: UC-001" required />

              {/* Tabla */}
              <Input label="Tabla" value={formData.tabla} onChange={(e) => setFormData({ ...formData, tabla: e.target.value })} placeholder="Ej: T-101" required />

              {/* Conductor */}
              <div className="space-y-1 relative">
                <label className="block text-sm font-medium text-slate-400">Conductor</label>
                <input
                  type="text"
                  value={searchTerms.conductor}
                  onChange={(e) => { setSearchTerms({ ...searchTerms, conductor: e.target.value }); setDropdowns({ ...dropdowns, conductor: true }); }}
                  onFocus={() => setDropdowns({ ...dropdowns, conductor: true })}
                  className="w-full px-4 py-2.5 rounded-lg input-dark"
                  placeholder="Buscar conductor..."
                />
                {dropdowns.conductor && searchTerms.conductor && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-auto">
                    {filteredConductores.map(c => (
                      <button key={c.id} type="button" onClick={() => selectConductor(c)} className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors">
                        <div className="font-medium">{c.nombre}</div>
                        {c.cedula && <div className="text-xs text-slate-400">Cédula: {c.cedula}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Horas */}
              <Input label="Hora Inicio" type="time" value={formData.hora_inicio} onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })} required />
              <Input label="Hora Fin" type="time" value={formData.hora_fin} onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })} required />

              {/* Servicio (Número) */}
              <Input label="Servicio" type="number" value={formData.servicio} onChange={(e) => setFormData({ ...formData, servicio: e.target.value })} placeholder="Ej: 1, 2..." />

              {/* Novedad */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-400">Tipo de Novedad</label>
                <select value={formData.tipo_novedad_id} onChange={(e) => setFormData({ ...formData, tipo_novedad_id: e.target.value })} className="w-full px-4 py-2.5 rounded-lg input-dark">
                  <option value="">Sin novedad</option>
                  {novedades.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                </select>
              </div>

              {/* Observaciones */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-slate-400">Observaciones</label>
                <textarea value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} className="w-full px-4 py-2.5 rounded-lg input-dark resize-none" rows="2" placeholder="Observaciones adicionales..." />
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="secondary" type="button" onClick={resetForm} className="flex-1 sm:flex-none">
                <RotateCcw className="w-4 h-4" /> Limpiar
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                {isSubmitting ? 'Enviando...' : 'Enviar Registro'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-slate-500 text-sm">
        © 2024 TransControl - Sistema de Registro de Conductores
      </footer>
    </div>
  );
}
