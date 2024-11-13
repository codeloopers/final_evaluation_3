import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import codesandbox from "../Images/codesandbox.png";
import './ShareComponent.css';

const ShareTask = () => {
  const { taskId } = useParams(); // Get task ID from URL parameters
  const [task, setTask] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await axios.get(`https://final-evaluaion-3.onrender.com/tasks/${taskId}`);
        setTask(response.data);
      } catch (error) {
        console.error("Error fetching task:", error);
      }
    };

    fetchTask();
  }, [taskId]);

  if (!task) {
    return <p>Loading task details...</p>;
  }

  // Calculate checklist counts
  const totalChecklist = task.checklist.length;
  const checklistCount = task.checklist.filter(item => item.completed).length;

  // Format due date to "Feb 12"
  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date'; // Fallback for no due date
    const options = { month: 'short', day: 'numeric' };
    return new Date(dueDate).toLocaleDateString('en-US', options);
  };

  // Determine the color based on priority
  const priorityColor = () => {
    switch (task.priority) {
      case 'HIGH PRIORITY':
        return '#e74c3c'; // Red for high priority
      case 'MODERATE PRIORITY':
        return '#18B0FF'; // Blue for moderate priority
      case 'LOW PRIORITY':
        return '#68B984'; // Green for low priority
      default:
        return 'black'; // Fallback color
    }
  };

  return (
    <>
    <div className="logo-share">
          <img src={codesandbox} alt="Pro Manage Logo" className="logo-icon-share" />
          <h4>Pro Manage</h4>
        </div>
    <div className="mainclass">
       
      <div className="detail">
        <span className="priority-indicators" style={{ backgroundColor: priorityColor() }}></span>
        <p className="priority-label">{task.priority}</p>
        <p>{task.title}</p>

        <div className="task-checklists">
          <span className="checklist-text">Checklist ({checklistCount}/{totalChecklist})</span>
          <div>
            {task.checklist.map((checklistItem) => (
              <div key={checklistItem._id} className="checklist-itemss">
                <input 
                  type="checkbox" 
                  className="checkbox-input-share"
                  checked={checklistItem.completed} 
                  readOnly 
                />
                <span>
                  {checklistItem.item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {task.dueDate && ( // Only show the due date block if it exists
          <div className="date-share">
            <p>Due Date:</p>
            <p className="due-date" style={{ background: task.priority === 'HIGH PRIORITY' ? '#e74c3c' : '#DBDBDB',color:'black' }}>
              {formatDueDate(task.dueDate)}
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default ShareTask;
