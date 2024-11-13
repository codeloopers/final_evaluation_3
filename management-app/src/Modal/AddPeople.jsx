import React, { useState, useEffect } from 'react';
import './AddPeople.css';
import AddPeopleConfirm from '../Modal/AddPeopleConfrm'; // Import the new modal component

const AddPeople = ({ onClose, loggedInUserEmail }) => {
  const [emailInput, setEmailInput] = useState('');
  const [allEmails, setAllEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null); // State to hold selected email
  const [confirmModalVisible, setConfirmModalVisible] = useState(false); // State to manage the confirmation modal visibility

  // Fetch all emails from the API when component mounts
  useEffect(() => {
    fetch('https://final-evaluaion-3.onrender.com/assign')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllEmails(data);
          setFilteredEmails(data); // Initially show all emails
        }
      })
      .catch((error) => console.error('Error fetching emails:', error));
  }, []);

  // Filter emails based on user input
  useEffect(() => {
    if (emailInput.trim()) {
      const filtered = allEmails.filter((user) =>
        user.email.toLowerCase().includes(emailInput.toLowerCase())
      );
      setFilteredEmails(filtered);
      // Check if the input email matches the logged-in user email
      if (loggedInUserEmail && emailInput.toLowerCase() === loggedInUserEmail.toLowerCase()) {
        setErrorMessage('You cannot assign the board to yourself.');
      } else {
        setErrorMessage('');
      }
    } else {
      setFilteredEmails(allEmails); // Show all emails if input is empty
      setErrorMessage('');
    }
  }, [emailInput, allEmails, loggedInUserEmail]);

  const handleEmailClick = (email) => {
    setEmailInput(email); // Show selected email in the input field
    setSelectedEmail(email); // Store selected email
    setShowDropdown(false); // Close the dropdown
  };

  const handleAddEmail = () => {
    // Check if the email input is empty
    if (!emailInput.trim()) {
      setErrorMessage('Please enter an email to assign.');
      return;
    }

    const loggedInEmail = localStorage.getItem('email'); // Get the logged-in user's email
    if (loggedInEmail === selectedEmail) {
      alert("Can't assign the board to yourself");
      return;
    }

    const currentUserId = localStorage.getItem('userId'); // Get the logged-in user's ID

    // Call the new API endpoint to update the assigned user by ID
    fetch('https://final-evaluaion-3.onrender.com/tasks/update-assignee', {
      method: 'PUT',
      body: JSON.stringify({ currentUserId, assignedEmail: selectedEmail }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        console.log('Tasks updated:', data);
        setConfirmModalVisible(true); // Open the confirmation modal
      })
      .catch(error => console.error('Error updating tasks:', error));
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalVisible(false); // Close the confirmation modal
    onClose(); // Close the main modal after confirmation
  };

  return (
    <div className="unique-add-modal">
      <div className="unique-add-modal-content">
        <div className="unique-alert-message">Add People to the Board</div>

        <div className="input-container-add">
        <input
        className={`input-text ${errorMessage ? 'error' : ''}`}
        type="email"
        placeholder={errorMessage ? `${errorMessage}` : "Enter email"}
        value={emailInput}
        onChange={(e) => setEmailInput(e.target.value)}
        onFocus={() => setShowDropdown(true)} // Show dropdown on focus
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay hiding to allow click
    />
         

          {/* Email Suggestions Dropdown */}
          {showDropdown && (
            <div className="email-dropdown">
              {filteredEmails.map((user) => (
                <div
                  key={user._id}
                  className="email-dropdown-item"
                  onClick={() => handleEmailClick(user.email)} // Call handleEmailClick on click
                >
                  {user.email}
                </div>
              ))}
            </div>
          )}
        </div>


        <div className="unique-alert-actions">
          <button
            className="unique-alert-button unique-alert-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="unique-alert-button unique-alert-confirm"
            onClick={handleAddEmail} // Call handleAddEmail on button click
          >
            Add Email
          </button>
        </div>
      </div>

      {/* AddPeopleConfirm Modal */}
      {confirmModalVisible && (
        <AddPeopleConfirm
          email={selectedEmail}
          onClose={handleCloseConfirmModal}
        />
      )}
    </div>
  );
};

export default AddPeople;
