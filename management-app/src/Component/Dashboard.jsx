import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import TaskModal from "../Modal/TaskModal";
import addperson from "../Images/addperson.png";
import board from "../Images/board.png";
import codesandbox from "../Images/codesandbox.png";
import Logout from "../Images/Logout.png";
import setting from "../Images/settings.png";
import database from "../Images/database.png";
import collapse from "../Images/collapse.png";
import TaskCard from "../Component/TaskCard";
import Analytics from "../Component/Analytics";
import Setting from "../Component/Setting";
import EditTaskModal from "../Modal/EditTaskModal";
import axios from "axios";
import io from "socket.io-client";
import { FaChevronDown } from "react-icons/fa";
import Delete from '../Modal/Delete';
import AddPeople from "../Modal/AddPeople";
import LogoutModal from "../Modal/Logout"

const socket = io("https://final-evaluaion-3.onrender.com", {
  query: { userId: localStorage.getItem("userId") },
  withCredentials: true
});

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("Board");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("This Week");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isAddPeopleOpen, setIsAddPeopleOpen] = useState(false);
  const [collapseTimestamp, setCollapseTimestamp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    Backlog: false,
    'To Do': false,
    'In progress': false,
    Done: false
  });

  const filterTasksByDate = (tasks, filterOption) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskCreationDate = (task) => new Date(task.createdAt);
    
    switch (filterOption) {
      case "Today":
        return tasks.filter(task => {
          const created = new Date(taskCreationDate(task));
          created.setHours(0, 0, 0, 0);
          return created.getTime() === today.getTime();
        });
        
      case "This Week":
        const startOfWeek = new Date(today);
        // Get current day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const currentDay = today.getDay();
        const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
                startOfWeek.setDate(today.getDate() - daysToSubtract);
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Set end of week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return tasks.filter(task => {
          const created = taskCreationDate(task);
          return created >= startOfWeek && created <= endOfWeek;
        });
        
      case "This Month":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        
        return tasks.filter(task => {
          const created = taskCreationDate(task);
          return created >= startOfMonth && created <= endOfMonth;
        });
        
      default:
        return tasks;
    }
  };

  const username = localStorage.getItem("name");

  const toggleDropdown = () => setIsOpen(!isOpen);

  const openTaskModal = () => setShowTaskModal(true);
  const closeTaskModal = () => setShowTaskModal(false);

  const handleEditClick = (taskId) => {
    setSelectedTaskId(taskId);
    setIsEditModalOpen(true);
    setIsOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTaskId(null);
  };

  const openAddPeopleModal = () => setIsAddPeopleOpen(true);
  const closeAddPeopleModal = () => setIsAddPeopleOpen(false);

  const handleDeleteClick = (taskId) => {
    setSelectedTaskId(taskId);
    setIsDeleteModalVisible(true);
  };

  const toggleCollapseSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));

    setCollapseTimestamp(Date.now());
  };

  const closeDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setSelectedTaskId(null);
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    socket.emit("joinUserRoom", userId);
    socket.emit("requestTasks", userId);

    socket.on("tasks", (updatedTasks) => {
      if (Array.isArray(updatedTasks)) {
        const filteredTasks = filterTasksByDate(updatedTasks, selectedOption);
        setTasks(filteredTasks);
      }
    });

    socket.on("taskStatusUpdated", ({ id, status }) => {
      setTasks(prevTasks =>
        prevTasks.map(task => task._id === id ? { ...task, status } : task)
      );
    });

    socket.on("newTask", (newTask) => {
      setTasks(prevTasks => {
        const updatedTasks = [...prevTasks, newTask];
        return filterTasksByDate(updatedTasks, selectedOption);
      });
    });

    return () => {
      socket.off("tasks");
      socket.off("taskStatusUpdated");
      socket.off("newTask");
    };
  }, [selectedOption]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        const [createdTasksResponse, assignedTasksResponse] = await Promise.all([
          axios.get("https://final-evaluaion-3.onrender.com/getTasks", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("https://final-evaluaion-3.onrender.com/getTasksAssignee", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        const userCreatedTasks = createdTasksResponse.data.filter(
          task => task.createdBy === userId
        );

        const userAssignedTasks = assignedTasksResponse.data.filter(
          task => task.assignedTo === userId
        );

        const allTasks = [...userCreatedTasks, ...userAssignedTasks];
        const filteredTasks = filterTasksByDate(allTasks, selectedOption);
        setTasks(filteredTasks);

        const statusCounts = filteredTasks.reduce((counts, task) => {
          const statusKey = task.status === "In progress" ? "InProgress" :
                          task.status === "To Do" ? "toDo" : task.status;
          const priority = task.priority === "HIGH PRIORITY" ? "highPriority" :
                         task.priority === "LOW PRIORITY" ? "lowPriority" :
                         task.priority === "MODERATE PRIORITY" ? "moderatePriority" : task.priority;

          counts[priority] = (counts[priority] || 0) + 1;
          counts[statusKey] = (counts[statusKey] || 0) + 1;
          return counts;
        }, {});

        setStatusCounts(statusCounts);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }finally {
        setLoading(false);
      }
    };

    if (activeItem === "Board") {
      fetchTasks();
    }
  }, [activeItem, selectedOption]);
// JavaScript to add drag scroll behavior for .board-columns
useEffect(() => {
  const boardColumns = document.querySelector('.board-columns');

  if (!boardColumns) return; // Exit if .board-columns is not found

  let isDragging = false;
  let startX;
  let scrollLeft;

  const mouseDownHandler = (e) => {
    isDragging = true;
    startX = e.pageX - boardColumns.offsetLeft;
    scrollLeft = boardColumns.scrollLeft;
    boardColumns.style.cursor = 'grabbing';
  };

  const mouseLeaveHandler = () => {
    isDragging = false;
    boardColumns.style.cursor = 'grab';
  };

  const mouseUpHandler = () => {
    isDragging = false;
    boardColumns.style.cursor = 'grab';
  };

  const mouseMoveHandler = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - boardColumns.offsetLeft;
    const walk = (x - startX) * 2; // Adjust the scroll speed as needed
    boardColumns.scrollLeft = scrollLeft - walk;
  };

  // Attach event listeners
  boardColumns.addEventListener('mousedown', mouseDownHandler);
  boardColumns.addEventListener('mouseleave', mouseLeaveHandler);
  boardColumns.addEventListener('mouseup', mouseUpHandler);
  boardColumns.addEventListener('mousemove', mouseMoveHandler);

  // Cleanup function to remove event listeners on component unmount
  return () => {
    boardColumns.removeEventListener('mousedown', mouseDownHandler);
    boardColumns.removeEventListener('mouseleave', mouseLeaveHandler);
    boardColumns.removeEventListener('mouseup', mouseUpHandler);
    boardColumns.removeEventListener('mousemove', mouseMoveHandler);
  };
}, []);

  

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };
  const handleCloseModal = () => {
    setLogoutModalOpen(false); 
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    setLogoutModalOpen(false);
  };

  const confirmDeleteTask = async () => {
    if (selectedTaskId) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`https://final-evaluaion-3.onrender.com/tasks/${selectedTaskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(prevTasks => prevTasks.filter(task => task._id !== selectedTaskId));
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
    setIsDeleteModalVisible(false);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`https://final-evaluaion-3.onrender.com/tasks/${taskId}/status`, {
        status: newStatus,
      });
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const formatDateWithOrdinal = (date) => {
    const day = date.getDate();
    const month = date.toLocaleString("en-IN", { month: "short" });
    const year = date.getFullYear();

    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };

    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
  };

  const renderTaskCards = (status) => {
    const filteredTasks = tasks.filter(task => task.status === status);
  
    // If no tasks are found, show the "No Tasks" card
    if (filteredTasks.length === 0) {
      return (
        <div className="no-tasks-card">
          <p>No tasks present in this section</p>
        </div>
      );
    }
  
    return filteredTasks.map(task => (
      <TaskCard
        key={`${task._id}-${collapseTimestamp}`}
        id={task._id}
        title={task.title}
        priority={task.priority}
        dueDate={task.dueDate}
        currentStatus={task.status}
        checklistCount={task.checklist.filter(item => item.completed).length}
        totalChecklist={task.checklist.length}
        checklists={task.checklist}
        onClick={() => handleStatusChange(task._id, status === "To do" ? "Backlog" : "To do")}
        creatorEmail={task.creatorEmail}
        onEdit={handleEditClick}
        onDelete={() => handleDeleteClick(task._id)}
        isCollapsed={collapsedSections[status]}
      />
    ));
  };
  

  return (
    <div className="dashboard">
    
      <aside className="sidebar">
        <div className="logo">
          <img src={codesandbox} alt="Pro Manage Logo" className="logo-icon" />
          <h1>Pro Manage</h1>
        </div>
        <nav>
          {["Board", "Analytics", "Settings"].map((item) => (
            <div
              key={item}
              className={`nav-item ${activeItem === item ? "active" : ""}`}
              onClick={() => setActiveItem(item)}
            >
              <img
                src={item === "Board" ? board : item === "Analytics" ? database : setting}
                alt={item}
                className="nav-icon"
              />
              <span className="nav-text">{item}</span>
            </div>
          ))}
        </nav>
        <div className="logout" onClick={handleLogoutClick}>
          <img src={Logout} alt="Logout" className="logout-icon" />
          <span>Log out</span>
        </div>
      </aside>

      <main className="main-content">
        {activeItem === "Board" && (
          <div className="board">
            <header>
              <h2>Welcome! {username}</h2>
              <div className="date">{formatDateWithOrdinal(new Date())}</div>
            </header>

            <div className="board-header">
              <div className="left-content">
                <h2>Board</h2>
                <img src={addperson} alt="Add People" className="add-person-icon" />
                <div className="add-people" onClick={openAddPeopleModal}>Add People</div>
              </div>

              <div className="custom-dropdown-container">
                <div className="custom-dropdown-trigger" onClick={toggleDropdown}>
                  {selectedOption} <FaChevronDown className="custom-dropdown-arrow" />
                </div>

                {isOpen && (
                  <div className="custom-dropdown-menu">
                    <div className="custom-dropdown-item" onClick={() => handleOptionClick("Today")}>
                      Today
                    </div>
                    <div className="custom-dropdown-item" onClick={() => handleOptionClick("This Week")}>
                      This Week
                    </div>
                    <div className="custom-dropdown-item" onClick={() => handleOptionClick("This Month")}>
                      This Month
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="board-columns">
              <div className="column">
                <div className="column-header">
                  <h3>Backlog</h3>
                  <button className="collaspe-icon-btn">
                  <img src={collapse} alt="" onClick={() => toggleCollapseSection('Backlog')} className="collaspe-icon"/>
                  </button>
                </div>
                <div className="task-list">{renderTaskCards("Backlog")}</div>
              </div>

              <div className="column">
                <div className="column-header">
                  <h3>To do</h3>
                  
                  <button className="add-task-icon " onClick={openTaskModal}>+</button>
                  <button className="collaspe-icon-btn">
                  <img src={collapse} alt="" onClick={() => toggleCollapseSection('To Do')} className="collaspe-icon" />
                  </button>
                </div>
                <div className="task-list">{renderTaskCards("To Do")}</div>
              </div>

              <div className="column">
                <div className="column-header">
                  <h3>In Progress</h3>
                  <button className="collaspe-icon-btn">
                  <img src={collapse} alt="" onClick={() => toggleCollapseSection('In progress')} className="collaspe-icon"/>
                  </button>
                </div>
                <div className="task-list">{renderTaskCards("In progress")}</div>
              </div>

              <div className="column">
                <div className="column-header">
                  <h3>Done</h3>
                  <button className="collaspe-icon-btn">
                  <img src={collapse} alt="" onClick={() => toggleCollapseSection('Done')} className="collaspe-icon"/>
                  </button>
                </div>
                <div className="task-list">{renderTaskCards("Done")}</div>
              </div>
            </div>
          </div>
        )}

        {activeItem === "Analytics" && <Analytics statusCounts={statusCounts} />}
        {activeItem === "Settings" && <Setting />}
      </main>

      {isEditModalOpen && (
        <EditTaskModal
          show={isEditModalOpen}
          onClose={closeEditModal}
          taskId={selectedTaskId}
        />
      )}

      {isDeleteModalVisible && (
        <Delete
          isVisible={isDeleteModalVisible}
          onConfirm={confirmDeleteTask}
          onCancel={closeDeleteModal}
          message="Are you sure you want to delete this task?"
          onDelete={handleDeleteClick}
        />
      )}

      {isAddPeopleOpen && (
        <div id="addPeopleModalUnique">
          <AddPeople onClose={closeAddPeopleModal} />
        </div>
      )}

      <TaskModal show={showTaskModal} onClose={closeTaskModal} />
      {isLogoutModalOpen && (
  <LogoutModal
    message="Are you sure you want to Logout?"
    onClose={handleCloseModal}
    onLogout={handleLogout}
  />
)}
    </div>
  );
};

export default Dashboard;