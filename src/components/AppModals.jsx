/**
 * AppModals - Centralized Modal Management
 * Gerenciamento Centralizado de Modais
 * 
 * Decouples modal imports from App.jsx to improve initialization performance.
 * Desacopla importações de modais do App.jsx para melhorar performance de inicialização.
 */

// Lazy load heavy modals if needed, but for now standard imports to ensure stability
// Importações padrão para garantir estabilidade (pode-se usar lazy load futuro)
import AIConfigModal from './AIConfigModal';
import HelpModal from './HelpModal';
import MonitoringDashboard from './MonitoringDashboard';
import ProfileModal from './ProfileModal';
import ServiceManagerModal from './ServiceManagerModal';
import SessionModal from './SessionModal';
import SettingsModal from './SettingsModal';
import ShutdownModal from './ShutdownModal';
import WorkflowModal from './modals/WorkflowModal';

const AppModals = ({
    // Modal States
    settingsModal,
    aiConfigModal,
    profileModal,
    servicesModal,
    sessionModal,
    helpModal,
    shutdownModal,
    monitoringDashboard,
    workflowModal,

    // Data & Handlers
    systemConfig,
    saveSystemConfig,
    aiConfig,
    saveAIConfig,
    serviceStatus,
    currentSessionName,
    setCurrentSessionName,
    chatManager,
    sessionService,
    handleShutdownComplete,
    handleRunWorkflow,
    t // translation function
}) => {
    return (
        <>
            <SettingsModal
                isOpen={settingsModal.isOpen}
                onClose={settingsModal.close}
                config={systemConfig}
                onSave={async (newSettings) => {
                    await saveSystemConfig(newSettings);
                    settingsModal.close();
                }}
                t={t}
            />

            <AIConfigModal
                isOpen={aiConfigModal.isOpen}
                onClose={aiConfigModal.close}
                config={aiConfig}
                onSave={async (newConfig) => {
                    await saveAIConfig(newConfig);
                    aiConfigModal.close();
                }}
            />

            <ProfileModal
                isOpen={profileModal.isOpen}
                onClose={profileModal.close}
            />

            <MonitoringDashboard
                isOpen={monitoringDashboard.isOpen}
                onClose={monitoringDashboard.close}
            />

            <SessionModal
                isOpen={sessionModal.isOpen}
                onClose={sessionModal.close}
                currentSession={currentSessionName}
                onLoad={(session) => {
                    chatManager.setBlocks(session.blocks);
                    setCurrentSessionName(session.name);
                    sessionModal.close();
                }}
                onSave={async (name) => {
                    await sessionService.saveSession(name, chatManager.blocks);
                    setCurrentSessionName(name);
                    sessionModal.close();
                }}
            />

            <ServiceManagerModal
                isOpen={servicesModal.isOpen}
                onClose={servicesModal.close}
                status={serviceStatus}
            />

            <HelpModal 
                isOpen={helpModal.isOpen} 
                onClose={helpModal.close} 
            />

            <WorkflowModal
                isOpen={workflowModal.isOpen}
                onClose={workflowModal.close}
                onRunWorkflow={handleRunWorkflow}
            />

            <ShutdownModal
                isOpen={shutdownModal.isOpen}
                onShutdownComplete={handleShutdownComplete}
            />
        </>
    );
};

export default AppModals;
