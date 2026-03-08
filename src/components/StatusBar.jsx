/**
 * StatusBar - Application Status Bar Component
 * Componente de Barra de Status da Aplicação
 */

const StatusBar = ({ 
  serviceStatus,
  currentIteration,
  maxIterations,
  unlimitedIterations 
}) => {
  const getServiceColor = (active) => 
    active ? 'bg-[#00ff00]' : 'bg-gray-600';

  return (
    <div className="bg-[#0a0a0a] border-t border-[#333] p-2 flex justify-between items-center text-xs">
      <div className="flex gap-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Services:</span>
          <div className="flex gap-1.5">
            <div className={`w-2 h-2 rounded-full ${getServiceColor(serviceStatus?.flask)}`} 
                 title="Flask" />
            <div className={`w-2 h-2 rounded-full ${getServiceColor(serviceStatus?.hexstrike)}`} 
                 title="HexStrike" />
            <div className={`w-2 h-2 rounded-full ${getServiceColor(serviceStatus?.brain)}`} 
                 title="Brain" />
          </div>
        </div>
      </div>
      <div className="text-gray-400">
        Iteration: {currentIteration} / {unlimitedIterations ? '∞' : maxIterations}
      </div>
    </div>
  );
};

export default StatusBar;
