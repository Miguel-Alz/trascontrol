const colorVariants = {
  primary: 'bg-indigo-500/20 text-indigo-400',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  info: 'bg-blue-500/20 text-blue-400',
  danger: 'bg-red-500/20 text-red-400',
};

export default function StatCard({ icon: Icon, value, label, color = 'primary' }) {
  return (
    <div className="glass-card rounded-xl p-6 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorVariants[color]}`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
      
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
    </div>
  );
}
