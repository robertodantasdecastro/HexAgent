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
import RAGModal from './modals/RAGModal';
import SudoModal from './modals/SudoModal';
import ActiveProcessesPanel from './panels/ActiveProcessesPanel';
import BugBountyPanel from './panels/BugBountyPanel';
import CTFPanel from './panels/CTFPanel';
import HexStrikeMonitorPanel from './panels/HexStrikeMonitorPanel';
import HexStrikeToolsPanel from './panels/HexStrikeToolsPanel';

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
    hexstrikeToolsModal,
    activeProcessesModal,
    hexstrikeMonitorModal,
    bugBountyModal,
    ctfModal,

    sudoModal,
    sudoActive,
    setSudoActive,

    ragModal,

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
    t // translation function
}) => {
    return (
        <>
            <SudoModal
                isOpen={sudoModal.isOpen}
                onClose={sudoModal.close}
                t={t}
                sudoActive={sudoActive}
                setSudoActive={setSudoActive}
            />
            <RAGModal
                isOpen={ragModal?.isOpen}
                onClose={ragModal?.close}
            />

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
                currentSessionName={currentSessionName}
                onLoadSession={async (name) => {
                    try {
                        const result = await sessionService.loadSession(name);
                        if (result.success) {
                            chatManager.setBlocks(result.blocks);
                            setCurrentSessionName(result.name);
                            sessionModal.close();
                        }
                    } catch (e) {
                         console.error("Failed to load session:", e);
                         // Ideally show a toast, but alert for now is consistent with legacy
                         alert(`Failed to load session: ${e.message}`);
                    }
                }}
                onSaveSession={async (name) => {
                    await sessionService.saveSession(name, chatManager.blocks);
                    setCurrentSessionName(name);
                    sessionModal.close();
                }}
                onClearSession={() => {
                    chatManager.setBlocks([]);
                    setCurrentSessionName(''); // Reset session name
                    sessionModal.close();
                }}
                onDeleteSession={async (name) => {
                    await sessionService.deleteSession(name);
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

            <ShutdownModal
                isOpen={shutdownModal.isOpen}
                onShutdownComplete={handleShutdownComplete}
            />

            <HexStrikeToolsPanel
                isOpen={hexstrikeToolsModal.isOpen}
                onClose={hexstrikeToolsModal.close}
            />

            <ActiveProcessesPanel
                isOpen={activeProcessesModal.isOpen}
                onClose={activeProcessesModal.close}
            />

            {hexstrikeMonitorModal?.isOpen && (
                <HexStrikeMonitorPanel
                    onClose={hexstrikeMonitorModal.close}
                />
            )}

            {bugBountyModal?.isOpen && (
                <BugBountyPanel
                    isOpen={bugBountyModal.isOpen}
                    onClose={bugBountyModal.close}
                />
            )}

            {ctfModal?.isOpen && (
                <CTFPanel
                    isOpen={ctfModal.isOpen}
                    onClose={ctfModal.close}
                />
            )}
        </>
    );
};

export default AppModals;
