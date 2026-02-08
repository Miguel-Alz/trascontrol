import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  Route,
  AlertTriangle,
  LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
  { to: '/admin/registros', icon: FileText, label: 'Registros', section: 'main' },
  { to: '/admin/empresas', icon: Building2, label: 'Empresas', section: 'modulos' },
  { to: '/admin/conductores', icon: Users, label: 'Conductores', section: 'modulos' },
  { to: '/admin/rutas', icon: Route, label: 'Rutas', section: 'modulos' },
  { to: '/admin/novedades', icon: AlertTriangle, label: 'Novedades', section: 'modulos' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const mainItems = navItems.filter((item) => item.section === 'main');
  const moduloItems = navItems.filter((item) => item.section === 'modulos');

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-700/50
          flex flex-col z-50 transition-transform duration-300
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg">TransControl</span>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium px-3 mb-2 block">
            Menú Principal
          </span>
          {mainItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1
                transition-all duration-200
                ${isActive
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}

          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium px-3 mt-4 mb-2 block">
            Módulos
          </span>
          {moduloItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1
                transition-all duration-200
                ${isActive
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer - Usuario */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-cyan-500 to-indigo-500 rounded-full flex items-center justify-center font-semibold text-sm">
              {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.username || 'Admin'}</p>
              <p className="text-xs text-slate-500">Administrador</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
