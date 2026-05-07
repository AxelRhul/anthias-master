import { Monitor, RefreshCcw } from 'lucide-react';

interface HeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export const Header = ({ loading, onRefresh }: HeaderProps) => (
  <header className="flex justify-between items-center border-b border-slate-800 pb-6">
    <h1 className="text-3xl font-black text-blue-500 flex items-center gap-3 italic">
      <Monitor size={36} /> ANTHIAS MASTER
    </h1>
    <button 
      onClick={onRefresh} 
      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition active:scale-95"
    >
      <RefreshCcw size={18} className={loading ? "animate-spin" : ""} /> 
      Actualiser
    </button>
  </header>
);