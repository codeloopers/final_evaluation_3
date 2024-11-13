// AlertModal.js
import React from 'react';
import './AlertModal.css';

const Delete = ({ isVisible, onConfirm, onCancel, message }) => {
  if (!isVisible) return null;

  const handleDelete = () => {
    onConfirm(); // Call the delete function passed as prop
  
  };

  const handlecancel = () => {
   
    onCancel();  // Close the modal after confirming
  };

  return (
    <div className="alert-modal-container">
      <div className="alert-modal">
        <div className="alert-message">{message}</div>
        <div className="alert-actions">
          <button className="alert-button alert-confirm" onClick={handleDelete}>
            Yes, Delete
          </button>
          <button className="alert-button alert-cancel" onClick={handlecancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Delete;