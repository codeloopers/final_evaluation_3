import React, { useState, useEffect, useRef } from 'react';
import './TaskCard.css';
import io from 'socket.io-client';
import EditTaskModal from '../Modal/EditTaskModal';
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
const socket = io("https://final-evaluaion-3.onrender.com", {
  query: { userId: localStorage.getItem("userId") },
  withCredentials: true
});

const TaskCard = ({ id, title, priority, dueDate, isCollapsed, checklistCount, totalChecklist, checklists, currentStatus, creatorEmail, onEdit, onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localChecklists, setLocalChecklists] = useState(checklists);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();
  

  // Add effect to watch for isCollapsed changes
  useEffect(() => {
    if (isCollapsed) {
      setIsExpanded(false);
    }
  }, [isCollapsed]);

  

  const handleShareClick = () => {
    // Copy the link to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/share/${id}`)
      .then(() => {
        // Show toast notification
        toast.success("Link copied!", {
          position: "top-right",
          autoClose: 1000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: { backgroundColor: '#F6FFF9', color: 'black' },
        });
      })
      .catch((err) => console.error("Failed to copy: ", err));
  };
  const menuRef = useRef(null);

  const statusOptions = {
    "backlog": ["In progress", "To Do", "Done"],
    "in progress": ["Backlog", "To Do", "Done"],
    "done": ["Backlog", "To Do", "In progress"],
    "to do": ["Backlog", "In progress", "Done"]
  };

  const getPriorityClass = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high priority':
        return 'high-priority';
      case 'low priority':
        return 'low-priority';
      case 'moderate priority':
        return 'medium-priority';
      default:
        return '';
    }
  };
 
  const toggleChecklist = () => {
    setIsExpanded((prev) => !prev);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  };

  const handleCheckboxChange = async (checklistItemId, isCompleted, item) => {
    console.log(`Updating checklist item ID: ${checklistItemId}, Current Completed State: ${isCompleted}, Item: ${item}`);
  
    try {
        const token = localStorage.getItem("token");
        console.log('Authorization Token:', token); // Log the token being used
  
        const response = await axios.put(
            `https://final-evaluaion-3.onrender.com/tasks/${id}/checklist/${checklistItemId}?completed=${!isCompleted}`, // Corrected URL and query param
            {
                item: item, // Send item as part of the request body
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
  
        console.log('Response Status:', response.status); // Log the response status
        console.log('Response Data:', response.data); // Log the response data
  
        // Update local state after successful API call
        setLocalChecklists((prevChecklists) =>
            prevChecklists.map((checklistItem) =>
                checklistItem._id === checklistItemId
                    ? { ...checklistItem, completed: !isCompleted } // Toggle completed state
                    : checklistItem
            )
        );
    } catch (error) {
        console.error('Error updating checklist item:', error);
    }
};

  

  

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`https://final-evaluaion-3.onrender.com/tasks/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        console.error('Failed to update task status on server');
        return;
      }

      socket.emit('updateTaskStatus', { id, status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    socket.on('taskStatusUpdated', ({ id: updatedId, status: newStatus }) => {
      if (updatedId === id) {
        setStatus(newStatus);
      }
    });

    return () => {
      socket.off('taskStatusUpdated');
    };
  }, [id]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    const { innerWidth, innerHeight } = window;
  
    const menuWidth = 120;
    const menuHeight = 100;
    
    const adjustedX = x + menuWidth > innerWidth ? innerWidth - menuWidth : x;
    const adjustedY = y + menuHeight > innerHeight ? innerHeight - menuHeight : y;
  
    setMenuPosition({ x: adjustedX, y: adjustedY });
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuOptionClick = (action) => {
    if (action === 'Edit') {
      setIsEditModalOpen(true);
    }
    setIsMenuOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const normalizedStatus = (status || "").toLowerCase().trim();
  const options = statusOptions[normalizedStatus] || [];

  return (
    <div className="task-card">
      <div className="task-header">
        <div className="task-priority">
          <span className={`priority-indicator ${getPriorityClass(priority)}`}></span>
          <span className="priority-label">{priority.toUpperCase()}</span>
          <span className={creatorEmail ? 'task-creator' : ''}>
            {creatorEmail ? creatorEmail.charAt(0).toUpperCase() : ''}
          </span>
        </div>
        <button className="menu-btn" onClick={toggleMenu}>
          <div className="menu-dots">
            <span className="menu-dot"></span>
            <span className="menu-dot"></span>
            <span className="menu-dot"></span>
          </div>
        </button>
      </div>

      {isMenuOpen && (
        <div ref={menuRef} className="menu-options" >
          <div className="menu-option" onClick={() => onEdit(id)}>Edit</div>
          <div className="menu-option" onClick={handleShareClick}>Share</div>
          <div className="menu-option delete" onClick={onDelete}>Delete</div>
        </div>
      )}
      {isEditModalOpen && (
        <EditTaskModal taskId={id} onClose={closeEditModal} />
      )}

      <h2 className="task-title" title={title}>{title}</h2>

      <div className="task-checklist">
        <span className="checklist-text">Checklist ({checklistCount}/{totalChecklist})</span>
        <button className="expand-btn" onClick={toggleChecklist}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={isExpanded ? 'expanded' : ''}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
          </svg>
        </button>
      </div>

      {isExpanded && localChecklists && (
    <ul className={`checklist-items ${isExpanded ? 'expanded' : ''}`}>
        {localChecklists.map((checklistItem) => (
            <li key={checklistItem._id} className="checklist-item">
                <input
                    type="checkbox"
                    checked={checklistItem.completed}
                    onChange={() => handleCheckboxChange(checklistItem._id, checklistItem.completed, checklistItem.item)}
                />
                <span className={checklistItem.completed ? 'completed' : ''}>{checklistItem.item}</span>
            </li>
        ))}
    </ul>
)}


      <div className="status">
        {dueDate && (
          <div
            className="due-date"
            style={{
              backgroundColor: 
                status.toLowerCase() !== 'done' && priority.toLowerCase() === 'high priority'
                  ? '#CF3636'
                  : status.toLowerCase() === 'done'
                    ? '#63C05B'
                    : '',
              color: 
                status.toLowerCase() !== 'done' && priority.toLowerCase() === 'high priority'
                  ? 'white'
                  : status.toLowerCase() === 'done'
                    ? 'white'
                    : '',
              fontWeight: 
                status.toLowerCase() !== 'done' && priority.toLowerCase() === 'high priority'
                  ? 'bold'
                  : 'normal',
            }}
          >
            <span>{formatDate(dueDate)}</span>
          </div>
        )}
        {options.map((option) => (
          <span key={option} className="task-status" onClick={() => handleStatusChange(option)}>{option}</span>
        ))}
      </div>
      
    </div>
    
  );
};

export default TaskCard;