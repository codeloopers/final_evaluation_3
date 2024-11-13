
import React from 'react';
import './AlertModal.css';

const Logout = ({ onClose, onLogout ,message}) => {

  
  return (
    <div className="alert-modal-container">
      <div className="alert-modal">
        <div className="alert-message">{message}</div>
        <div className="alert-actions">
          <button className="alert-button alert-confirm" onClick={onLogout}>
            Yes, Logout
          </button>
          <button className="alert-button alert-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logout;