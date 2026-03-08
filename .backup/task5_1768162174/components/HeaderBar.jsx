/**
 * HeaderBar - Application Header Component
 * Componente de Cabeçalho da Aplicação
 */

import { Settings } from 'lucide-react';

const HeaderBar = ({ 
  status, 
  title = "HexAgent GUI",
  onSettingsClick 
}) => {
  const statusColors = {
    'ONLINE': 'text-[#00ff00]',
    'OFFLINE': 'text-red-500',
    'CONNECTING': 'text-yellow-500'
  };

  return (
    <header className="bg-[#0a0a0a] border-b border-[#333] p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <span className={`text-sm ${statusColors[status] || 'text-gray-500'}`}>
          [{status}]
        </span>
      </div>
      <button
        onClick={onSettingsClick}
        className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
        aria-label="Settings"
      >
        <Settings className="text-gray-400 hover:text-white" size={20} />
      </button>
    </header>
  );
};

export default HeaderBar;
