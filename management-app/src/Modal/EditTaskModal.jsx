import React, { useState, useEffect, useRef } from 'react';
import './TaskModal.css';
import { FaTrash } from 'react-icons/fa';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('https://final-evaluaion-3.onrender.com');

const EditTaskModal = ({ onClose, onSave, show, taskId }) => {
  const userid = localStorage.getItem('email');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [date, setDate] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const dropdownRef = useRef(null);

  const resetForm = () => {
    setTitle('');
    setPriority('HIGH');
    setAssignee('');
    setDueDate('');
    setDate(null);
    setChecklist([]);
  };

  useEffect(() => {
    if (taskId && show) {
      setLoading(true); // Start loading
      axios.get(`https://final-evaluaion-3.onrender.com/tasks/${taskId}`)
        .then(response => {
          const taskData = response.data;
          setTitle(taskData.title);
          setPriority(taskData.priority);
          setAssignee(taskData.assignedTo);
          setDate(taskData.dueDate ? new Date(taskData.dueDate) : null);
          setChecklist(taskData.checklist.map(item => ({
            id: Math.random().toString(36).substr(2, 9),
            text: item.item,
            done: item.completed || false,
            isEditing: false
          })));
          setLoading(false); // Data is fetched, end loading
        })
        .catch(error => {
          console.error('Error fetching task:', error);
          setLoading(false); // End loading on error
        });
    }
  }, [taskId, show]);

  // Disable actions until data is loaded
  const isDisabled = loading || !show;

  const handleChecklistChange = (id) => {
    setChecklist(prevChecklist => {
      const newChecklist = prevChecklist.map(item => {
        if (item.id === id) {
          return { ...item, done: !item.done };
        }
        return item;
      });
      return newChecklist;
    });
  };

  const handleToggleEdit = (id, isEditing) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, isEditing } : item
    ));
  };

  const handleEditTextChange = (id, text) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, text } : item
    ));
  };

  const handleAddChecklistItem = () => {
    const newItem = { id: Date.now(), text: 'Task To be Done', done: false, isEditing: false };
    setChecklist([...checklist, newItem]);
  };

  const handleDeleteChecklistItem = (id) => {
    if (checklist.length > 1) {
      setChecklist(prev => prev.filter(item => item.id !== id));
    } else {
      alert("At least one checklist item is required.");
    }
  };

  const handleSave = () => {
    if (checklist.length === 0) {
      alert("Please add at least one checklist item before saving.");
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
    
    console.log(taskData);

    axios.put(`https://final-evaluaion-3.onrender.com/tasks/${taskId}`, taskData)
      .then((response) => {
        console.log('Success:', response.data);
        onClose();
        resetForm();
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  useEffect(() => {
    if (show) {
      fetch('https://final-evaluaion-3.onrender.com/assign')
        .then(response => response.json())
        .then(data => setAssignees(data))
        .catch(error => console.error('Error fetching assignees:', error));
    }
  }, [show]);

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
            disabled={isDisabled} // Disable based on loading state
          />
        </div>
        <div className="priority-group">
          <div className="modal-title">Select Priority <span>*</span></div>
          {['HIGH PRIORITY', 'MODERATE PRIORITY', 'LOW PRIORITY'].map((p) => (
            <div 
              key={p}
              className={`priority-btn ${priority === p ? 'selected' : ''}`}
              onClick={() => setPriority(p)}
              style={{ pointerEvents: isDisabled ? 'none' : 'auto' }} // Disable clicks
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
              style={{ pointerEvents: isDisabled ? 'none' : 'auto' }} // Disable clicks
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
                onChange={() => handleChecklistChange(item.id)}
                disabled={isDisabled}
              />
              {item.isEditing ? (
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => handleEditTextChange(item.id, e.target.value)}
                  onBlur={() => handleToggleEdit(item.id, false)}
                  autoFocus
                  disabled={isDisabled}
                />
              ) : (
                <span onClick={() => handleToggleEdit(item.id, true)}>{item.text}</span>
              )}
              <div 
                className="btn btn-delete" 
                onClick={() => handleDeleteChecklistItem(item.id)}
                style={{ marginLeft: '10px', background: 'transparent', border: 'none', cursor: 'pointer', pointerEvents: isDisabled ? 'none' : 'auto' }}
              >
                <FaTrash style={{ color: 'red' }} />
              </div>
            </div>
          ))}
          <div className="add-new" onClick={handleAddChecklistItem} style={{ pointerEvents: isDisabled ? 'none' : 'auto' }}>+ Add New</div>
        </div>

        <div className="button-group">
          <div className="input-calender">
            <DatePicker 
              className="date-picker" 
              selected={date} 
              dateFormat="MM/dd/yyyy" 
              on
Change={(date) => setDate(date)} 
              placeholderText="Select Due Date"
              minDate={new Date()}
            />
          </div>
          <button className="btn-cancel" onClick={() => { onClose(); resetForm(); }}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;
