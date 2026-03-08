/**
 * UserBlock Component
 * Componente de Bloco do Usuário
 * 
 * Displays user messages with edit and re-execute options.
 * Wrapped in React.memo to prevent redundant re-renders.
 * 
 * Exibe mensagens do usuário com opções de editar e reexecutar.
 * Encapsulado em React.memo para evitar re-renderizações desnecessárias.
 */

import { Edit2, RefreshCw, User } from 'lucide-react';
import { memo, useState } from 'react';
import './UserBlock.css';

const UserBlock = memo(({ content, onEdit, onReexecute, timestamp }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    if (editedContent.trim() !== content) {
      onEdit?.(editedContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleReexecute = () => {
    onReexecute?.(content);
  };

  return (
    <div className="user-block">
      <div className="user-block-header">
        <div className="user-avatar">
          <User size={18} />
        </div>
        <span className="user-label">You</span>
        {timestamp && (
          <span className="user-timestamp">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="user-block-content">
        {isEditing ? (
          <div className="user-edit-mode">
            <textarea
              className="user-edit-textarea"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              autoFocus
              rows={3}
            />
            <div className="user-edit-actions">
              <button className="btn-save" onClick={handleSave}>
                Save
              </button>
              <button className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="user-message">
            {content || <span style={{opacity: 0.5, fontStyle: 'italic'}}>(Empty message)</span>}
          </p>
        )}
      </div>

      {!isEditing && (
        <div className="user-block-actions">
          <button
            className="user-action-btn"
            onClick={() => setIsEditing(true)}
            title="Edit message"
          >
            <Edit2 size={14} />
            <span>Edit</span>
          </button>
          <button
            className="user-action-btn"
            onClick={handleReexecute}
            title="Re-execute"
          >
            <RefreshCw size={14} />
            <span>Re-run</span>
          </button>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if content or timestamp changed
  // Comparação customizada: re-renderizar apenas se content ou timestamp mudou
  return (
    prevProps.content === nextProps.content &&
    prevProps.timestamp === nextProps.timestamp &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onReexecute === nextProps.onReexecute
  );
});

UserBlock.displayName = 'UserBlock';

export { UserBlock };
export default UserBlock;
