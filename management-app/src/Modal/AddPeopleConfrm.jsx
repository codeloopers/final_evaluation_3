import React from 'react';
import './AddPeople.css';

const AddPeopleConfirm = ({ email, onClose }) => {
  return (
    <div className="unique-addc-modal">
      <div className="unique-addc-modal-content">
        <div className="unique-alert-message">{email} added to board</div>
        <div className="unique-alert-actions">
          <button
            className="unique-alert-button unique-alerts-confirm"
            onClick={onClose}
          >
            Okay, got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPeopleConfirm;
