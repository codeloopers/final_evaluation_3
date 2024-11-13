import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Analytics.css';

const Analytics = () => {
  const [statusCounts, setStatusCounts] = useState({
    Backlog: 0,
    toDo: 0,
    InProgress: 0,
    Done: 0,
    lowPriority: 0,
    moderatePriority: 0,
    highPriority: 0,
    dueDateTasks: 0,
  });
  const [loading, setLoading] = useState(true); // Add loading state

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tasks created by the user
        const createdTasksResponse = await axios.get('https://final-evaluaion-3.onrender.com/getTasks', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch tasks assigned to the user
        const assignedTasksResponse = await axios.get('https://final-evaluaion-3.onrender.com/getTasksAssignee', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filter created tasks to match the logged-in user
        const userCreatedTasks = createdTasksResponse.data.filter(task => task.createdBy === userId);

        // Filter assigned tasks to match the logged-in user
        const userAssignedTasks = assignedTasksResponse.data.filter(task => task.assignedTo === userId);

        // Combine both sets of tasks
        const allTasks = [...userCreatedTasks, ...userAssignedTasks];

        // Calculate the status count
        const counts = allTasks.reduce((acc, task) => {
          const statusKey = task.status === "In progress" ? "InProgress" : 
                            task.status === "To Do" ? "toDo" : 
                            task.status;
          const priority = task.priority === "HIGH PRIORITY" ? "highPriority" : 
                           task.priority === "LOW PRIORITY" ? "lowPriority" : 
                           task.priority === "MODERATE PRIORITY" ? "moderatePriority" : 
                           task.priority;
          const dueDate = task.dueDate ? "dueDateTasks" : "";

          acc[priority] = (acc[priority] || 0) + 1;
          acc[statusKey] = (acc[statusKey] || 0) + 1;
          acc[dueDate] = (acc[dueDate] || 0) + 1;
          return acc;
        }, {});

        setStatusCounts(counts);
        setLoading(false); // Set loading to false after data is fetched
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        setLoading(false); // Set loading to false if there's an error
      }
    };

    fetchData();
  }, [userId, token]);

  const taskCounts = [
    { label: "Backlog Tasks", value: statusCounts.Backlog || 0 },
    { label: "To-do Tasks", value: statusCounts.toDo || 0 },
    { label: "In-Progress Tasks", value: statusCounts.InProgress || 0 },
    { label: "Completed Tasks", value: statusCounts.Done || 0 },
  ];

  const priorityCounts = [
    { label: "Low Priority", value: statusCounts.lowPriority || 0 },
    { label: "Moderate Priority", value: statusCounts.moderatePriority || 0 },
    { label: "High Priority", value: statusCounts.highPriority || 0 },
    { label: "Due Date Tasks", value: statusCounts.dueDateTasks || 0 },
  ];

  if (loading) {
    return <div className="loading">Loading...</div>; // Show loading text or spinner
  }

  return (
    <>
      <h3>Analytics</h3>
      <div className="Analytics">
        {[taskCounts, priorityCounts].map((group, index) => (
          <div className="Analytics-header" key={index}>
            {group.map((item, idx) => (
              <div className="Analytics-item" key={idx}>
                <span className="eclips"></span>
                <span>{item.label}</span>
                <span className="value">{item.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default Analytics;
