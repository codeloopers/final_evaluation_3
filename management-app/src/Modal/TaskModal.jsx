import React, { useState, useEffect, useRef } from 'react';
import './TaskModal.css';
import { FaTrash } from 'react-icons/fa';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import io from 'socket.io-client';


const socket = io('https://final-evaluaion-3.onrender.com');

const TaskModal = ({ onClose, onSave, show }) => {
  const userid = localStorage.getItem('email');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [date, setDate] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const dropdownRef = useRef(null);

  const resetForm = () => {
    setTitle('');
    setPriority('');
    setAssignee('');
    setDueDate('');
    setDate(null);
    setChecklist([]);
  };

  const handleChecklistChange = (id, done) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, done } : item
    ));
  };

  const handleToggleEdit = (id, isEditing) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isEditing, text: isEditing && item.text === '' ? '' : item.text } : item
      )
    );
  };
  

  const handleEditTextChange = (id, text) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, text } : item
    ));
  };

  const handleAddChecklistItem = () => {
    const newItem = { 
      id: Date.now(), 
      text: '',  // Set text as an empty string for placeholder
      done: false, 
      isEditing: true  // Start in editing mode to focus on the input
    };
    setChecklist(prevChecklist => [...prevChecklist, newItem]);
};


  const handleDeleteChecklistItem = (id) => {
    if (checklist.length > 1) {
      setChecklist(prev => prev.filter(item => item.id !== id));
    } else {
      alert("At least one checklist item is required.");
    }
  };

  const handleSave = () => {
    if (!title) {
      alert("Title is required.");
      return;
    }

    if (!priority) {
      alert("Priority is required.");
      return;
    }

    if (checklist.length === 0) {
      alert("Please add at least one checklist item.");
      return;
    }

  

    const taskData = {
      title,
      createdBy: userid,
      priority,
      assignedTo: assignee,
      checklist: checklist.map(item => ({ 
          item: item.text, 
          completed: item.done 
      })),
      dueDate: date ? date.toISOString() : null,
    };

    axios.post('https://final-evaluaion-3.onrender.com/tasks', taskData)
      .then((response) => {
        console.log('Success:', response.data);
        onClose();
        resetForm();
      })
      .catch((error) => {
        console.error('Error:', error);
      })
  };

  useEffect(() => {
    if (show) {
      fetch('https://final-evaluaion-3.onrender.com/assign')
        .then(response => response.json())
        .then(data => setAssignees(data))
        .catch(error => console.error('Error fetching assignees:', error));
    }
  }, [show]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleAssignClick = (email) => {
    if (email === userid) {
      alert("You can't assign a task to yourself.");
    } else {
      setAssignee(email);
      setIsDropdownOpen(false);
    }
  };
  
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">Title <span>*</span></div>
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Enter Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="priority-group">
          <div className="modal-title">Select Priority <span>*</span></div>
          {['HIGH PRIORITY', 'MODERATE PRIORITY', 'LOW PRIORITY'].map((p) => (
            <div 
              key={p}
              className={`priority-btn ${priority === p ? 'selected' : ''}`}
              onClick={() => setPriority(p)}
            >
              <span className={`priority-ellipse ${p.toLowerCase()}`}></span>
              {p}
            </div>
          ))}
        </div>

        <div className="input-group">
          <div className="modal-title">Assign to</div>
          <div ref={dropdownRef} className="custom-assign-dropdown">
            <div 
              className="dropdown-toggle" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {assignee || 'Select an assignee'}
            </div>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                {assignees.map((assigneeItem) => (
                  <div key={assigneeItem.email} className="assignee-item">
                    <div className="assignee-initial-circle">
                      {assigneeItem.email.charAt(0).toUpperCase()}
                    </div>
                    <span>{assigneeItem.email}</span>
                    <div 
                      onClick={() => handleAssignClick(assigneeItem.email)} 
                      className="assign-btn"
                    >
                      Assign
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="input-group-checklist">
          <label>Checklist ({checklist.filter(item => item.done).length}/{checklist.length})</label>
          {checklist.map((item) => (
            <div key={item.id} className="checklist-item">
              <input 
                type="checkbox"
                checked={item.done}
                onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
              />
          
  {item.isEditing ? (
    <input
      type="text"
      value={item.text === '' ? '' : item.text}  // Display blank input in edit mode
      placeholder="Task To be Done"  // Show placeholder only when input is unfocused
      onChange={(e) => handleEditTextChange(item.id, e.target.value)}
      onBlur={() => handleToggleEdit(item.id, false)}
      autoFocus
    />
  ) : (
    <span onClick={() => handleToggleEdit(item.id, true)}>
      {item.text || 'Task To be Done'}  
    </span>
  )}
  

              <div 
                className="btn btn-delete" 
                onClick={() => handleDeleteChecklistItem(item.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <FaTrash style={{ color: 'red' }} />
              </div>
            </div>
          ))}
          <div className="add-new" onClick={handleAddChecklistItem} role="button" tabIndex={0}>
            + Add New
          </div>
        </div>

        <div className="button-group">
          <div className="input-calender">
            <DatePicker 
              className="date-picker" 
              selected={date} 
              dateFormat="MM/dd/yyyy" 
              onChange={(date) => setDate(date)} 
              placeholderText="Select Due Date"
              minDate={new Date()}
            />
          </div>
          <button className="btn-cancel" onClick={() => { onClose(); resetForm(); }}>Cancel</button>
          <button 
            className="btn-save" 
            onClick={handleSave} 
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
