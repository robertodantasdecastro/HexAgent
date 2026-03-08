/**
 * useModalState - Reusable React hook for modal state management
 * useModalState - Hook React reutilizável para gerenciamento de estado de modais
 * 
 * Simplifies modal management by providing a consistent API for:
 * Simplifica gerenciamento de modais fornecendo API consistente para:
 * - Opening/closing modals / Abrir/fechar modais
 * - Toggle functionality / Funcionalidade de alternância
 * - State persistence / Persistência de estado
 * 
 * Benefits / Benefícios:
 * - Reduces boilerplate code / Reduz código boilerplate
 * - Consistent modal behavior / Comportamento consistente de modais
 * - Easy to test / Fácil de testar
 * - Reusable across all modal components / Reutilizável em todos componentes de modal
 * 
 * @example
 * // Basic usage / Uso básico
 * function MyComponent() {
 *   const settingsModal = useModalState();
 *   
 *   return (
 *     <>
 *       <button onClick={settingsModal.open}>Open Settings</button>
 *       <Modal isOpen={settingsModal.isOpen} onClose={settingsModal.close}>
 *         Settings Content
 *       </Modal>
 *     </>
 *   );
 * }
 * 
 * @example
 * // With initial state / Com estado inicial
 * const modal = useModalState(true); // Starts open / Começa aberto
 * 
 * @example
 * // With callback / Com callback
 * const modal = useModalState(false, {
 *   onOpen: () => console.log('Modal opened'),
 *   onClose: () => console.log('Modal closed')
 * });
 * 
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 * @version 1.0.0
 */

import { useCallback, useState } from 'react';

/**
 * Hook for managing modal state / Hook para gerenciar estado de modal
 * 
 * @param {boolean} [initialOpen=false] - Initial open state / Estado inicial de abertura
 * @param {Object} [options={}] - Additional options / Opções adicionais
 * @param {Function} [options.onOpen] - Callback when modal opens / Callback ao abrir modal
 * @param {Function} [options.onClose] - Callback when modal closes / Callback ao fechar modal
 * @param {Function} [options.onToggle] - Callback when modal toggles / Callback ao alternar modal
 * @returns {Object} Modal state and methods / Estado e métodos do modal
 * @returns {boolean} returns.isOpen - Current open state / Estado atual de abertura
 * @returns {Function} returns.open - Function to open modal / Função para abrir modal
 * @returns {Function} returns.close - Function to close modal / Função para fechar modal
 * @returns {Function} returns.toggle - Function to toggle modal / Função para alternar modal
 * @returns {Function} returns.setIsOpen - Direct state setter / Setter direto de estado
 */
export const useModalState = (initialOpen = false, options = {}) => {
  const {
    onOpen,
    onClose,
    onToggle
  } = options;

  const [isOpen, setIsOpen] = useState(initialOpen);

  /**
   * Open the modal / Abrir o modal
   * Calls onOpen callback if provided / Chama callback onOpen se fornecido
   */
  const open = useCallback(() => {
    setIsOpen(true);
    if (onOpen && typeof onOpen === 'function') {
      onOpen();
    }
  }, [onOpen]);

  /**
   * Close the modal / Fechar o modal
   * Calls onClose callback if provided / Chama callback onClose se fornecido
   */
  const close = useCallback(() => {
    setIsOpen(false);
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  }, [onClose]);

  /**
   * Toggle the modal state / Alternar estado do modal
   * Calls onToggle callback if provided / Chama callback onToggle se fornecido
   */
  const toggle = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev;
      if (onToggle && typeof onToggle === 'function') {
        onToggle(newState);
      }
      // Also call onOpen or onClose / Também chamar onOpen ou onClose
      if (newState && onOpen) {
        onOpen();
      } else if (!newState && onClose) {
        onClose();
      }
      return newState;
    });
  }, [onToggle, onOpen, onClose]);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen // For advanced use cases / Para casos de uso avançados
  };
};

export default useModalState;
