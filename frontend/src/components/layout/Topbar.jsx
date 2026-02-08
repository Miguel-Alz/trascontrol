import { Menu, RefreshCw } from 'lucide-react';

export default function Topbar({ title, onMenuClick, onRefresh }) {
  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
