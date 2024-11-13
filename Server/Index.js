const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');

const Register = require('../Server/Models/User');
const Task = require('../Server/Models/TaskSchema');
const Assign = require('../Server/Models/AssignSchema');
const Auth = require('./Middleware/Auth.js');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['https://final-evaluaion-3.vercel.app', 'http://localhost:3000','http://localhost:3001'], // Adjust this to your React app's URL
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['my-custom-header', 'Authorization', 'Content-Type'],
        credentials: true // Enable credentials if needed
    }
});

// Your other middlewares and routes here
// Use CORS middleware for other routes
app.use(cors({
    origin: ['https://final-evaluaion-3.vercel.app', 'http://localhost:3000','http://localhost:3001'], // Match this to frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

// Socket.IO connection event
io.on('connection', (socket) => {
    console.log('A client connected');

    // Listen for the 'joinUserRoom' event to join a specific room based on the user ID
    socket.on('joinUserRoom', (userId) => {
        if (userId) {
            socket.join(`user-${userId}`); // Join a room named with the user ID
            console.log(`User ${userId} joined their specific room`);
        }
    });

    // Handle requests for tasks specific to the logged-in user
    socket.on('requestTasks', async (userId) => {
        try {
            const tasks = await Task.find({ createdBy: userId }); // Fetch tasks created by this user
            io.to(`user-${userId}`).emit('tasks', tasks); // Emit tasks to the specific user's room
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    });

    // Handle individual task status updates, emitting only to the relevant user's room
    socket.on('taskStatusUpdated', async ({ id, status, createdBy }) => {
        try {
            // Update the task status in the database
            await Task.findByIdAndUpdate(id, { status });

            // Emit the status update only to the room of the user who created the task
            io.to(`user-${createdBy}`).emit('taskStatusUpdated', { id, status });
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});


app.put('/tasks/:id/status', async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    try {
        const task = await Task.findByIdAndUpdate(id, { status }, { new: true });

        if (task) {
            // Emit an event to notify clients about the specific task status update
            io.emit('taskStatusUpdated', { id: task._id, status: task.status });

            res.status(200).json({ message: 'Status updated successfully', task });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error });
    }
});



  

// Route to fetch assigned users
app.get('/assign', async (req, res) => {
    try {
        const users = await Register.find().lean();
        if (!users) {
            return res.status(404).json({ message: 'No assignee found' });
        }
        res.status(200).json(users);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to create a new task
app.post('/tasks', async (req, res) => {
    const { title, description, createdBy, assignedTo, priority, status, dueDate, checklist } = req.body;

    try {
        const creator = await Register.findOne({ email: createdBy });
        if (!creator) {
            return res.status(404).json({ message: 'Creator not found' });
        }

        let assignee = null;
        if (assignedTo) {
            assignee = await Register.findOne({ email: assignedTo });
            if (!assignee) {
                return res.status(404).json({ message: 'Assignee not found' });
            }
        }

        const newTask = new Task({
            title,
            description,
            createdBy: creator._id,
            assignedTo: assignee ? assignee._id : null,
            priority,
            status: status || 'To Do',
            dueDate: dueDate || null,
            checklist: checklist.map(item => ({
                item: item.item,
                completed: item.completed || false // Ensure this defaults to false if not provided
            })),
        });

        const savedTask = await newTask.save();

        // Emit the new task to the creator’s room only
        io.to(`user-${creator._id}`).emit('newTask', savedTask);

        res.status(201).json({
            message: 'Task created successfully',
            task: savedTask,
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
app.put('/tasks/update-assignee', async (req, res) => {
    const { currentUserId, assignedEmail } = req.body; // Expecting currentUserId and assignedEmail in the body

    if (!currentUserId || !assignedEmail) {
        return res.status(400).json({ message: 'currentUserId and assignedEmail are required.' });
    }

    try {
        // Find the user ID based on the assigned email
        const assignedUser = await Register.findOne({ email: assignedEmail });
        if (!assignedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update tasks for the specific user using assignedUser._id
        const updatedTasks = await Task.updateMany(
            { createdBy: currentUserId }, // Filter by current assigned user
            { assignedTo: assignedUser._id }, // Update to new user ID
            { new: true } // Return the updated documents
        );

        res.status(200).json(updatedTasks);
    } catch (error) {
        console.error('Error updating tasks:', error);
        res.status(500).json({ message: 'Error updating tasks' });
    }
});


app.get('/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
  
      const user = await Register.findById(userId, 'email'); // Fetches only the email field
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


  app.put('/tasks/:taskId', async (req, res) => {
    try {
      const { taskId } = req.params;
      const taskData = req.body;
  
      // Convert assignedTo email to userId if provided
      if (taskData.assignedTo) {
        const user = await Register.findOne({ email: taskData.assignedTo });
        if (user) {
          taskData.assignedTo = user._id;
        } else {
          return res.status(404).json({ message: 'User not found for assignedTo' });
        }
      }
  
      // Convert createdBy email to userId if needed
      if (taskData.createdBy) {
        const creator = await Register.findOne({ email: taskData.createdBy });
        if (creator) {
          taskData.createdBy = creator._id;
        } else {
          return res.status(404).json({ message: 'User not found for createdBy' });
        }
      }
  
      const updatedTask = await Task.findByIdAndUpdate(taskId, taskData, {
        new: true,
      });
  
      if (!updatedTask) {
        return res.status(404).json({ message: 'Task not found' });
      }
  
      // After successful update, fetch all tasks for the creator
      const allUserTasks = await Task.find({ createdBy: updatedTask.createdBy });
      
      // Emit all tasks to the creator's room
      io.to(`user-${updatedTask.createdBy}`).emit('tasks', allUserTasks);
  
      // If task is assigned to someone else, fetch their tasks and emit
      if (updatedTask.assignedTo && updatedTask.assignedTo.toString() !== updatedTask.createdBy.toString()) {
        const assigneeTasks = await Task.find({ 
          $or: [
            { createdBy: updatedTask.assignedTo },
            { assignedTo: updatedTask.assignedTo }
          ]
        });
        io.to(`user-${updatedTask.assignedTo}`).emit('tasks', assigneeTasks);
      }
  
      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

// Route to create a new task
app.post('/assigntask', async (req, res) => {
    const { title, description, createdBy, assignedTo, priority, status, dueDate, checklist } = req.body;

    try {
        const creator = await Register.findOne({ email: createdBy });
        if (!creator) {
            return res.status(404).json({ message: 'Creator not found' });
        }

        let assignee = null;
        if (assignedTo) {
            assignee = await Register.findOne({ email: assignedTo });
            if (!assignee) {
                return res.status(404).json({ message: 'Assignee not found' });
            }
        }

        const newTask = new Assign({
            title,
            description,
            createdBy: creator._id,
            assignedTo: assignee ? assignee._id : null,
            priority: priority,
            status: status || 'To Do',
            dueDate: dueDate || null,
            checklist: checklist || [],
        });

        const savedTask = await newTask.save();

        // Emit the updated tasks to all connected clients
        const allTasks = await Assign.find();
        io.emit('tasks', allTasks); // Broadcast updated tasks to all clients

        res.status(201).json({
            message: 'Task created successfully',
            task: savedTask,
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
// Route to fetch tasks for the logged-in user
app.get('/getTasks',Auth, async (req, res) => {
    const userId = req.user.id;

    try {
        const tasks = await Task.find({ createdBy: userId });
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Error fetching tasks.' });
    }
});

app.get('/getTasksAssignee', Auth, async (req, res) => {
    const userId = req.user.id; // ID of the logged-in user

    try {
        // Fetch tasks assigned to the logged-in user
        const tasks = await Task.find({ assignedTo: userId });

        // Fetch the creator's emails for the tasks
        const taskCreators = await Register.find({
            _id: { $in: tasks.map(task => task.createdBy) } // Get all unique creator IDs from tasks
        });

        // Create a mapping of creator ID to email
        const creatorEmails = {};
        taskCreators.forEach(creator => {
            creatorEmails[creator._id] = creator.email; // Assuming the email field is called 'email'
        });

        // Add the creator's email to each task
        const tasksWithEmails = tasks.map(task => ({
            ...task._doc, // Spread the original task properties
            creatorEmail: creatorEmails[task.createdBy] || null // Add the creator's email
        }));

        res.status(200).json(tasksWithEmails);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Error fetching tasks.' });
    }
});

app.delete("/tasks/:taskId", Auth, async (req, res) => {
    const { taskId } = req.params;
  
    try {
      // Find and delete the task by ID
      const deletedTask = await Task.findByIdAndDelete(taskId);
  
      if (!deletedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      res.status(200).json({ message: "Task deleted successfully", taskId });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app.get("/tasks/:taskId", async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId).lean();
    
        if (!task) {
          return res.status(404).json({ message: 'Task not found' });
        }
    
        // Fetch email for assignedTo
        if (task.assignedTo) {
          const user = await Register.findById(task.assignedTo, 'email');
          task.assignedTo = user ? user.email : null;
        }
    
        res.json(task);
      } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
  });
  

app.put('/tasks/:id/checklist/:checklistItemId', async (req, res) => {
    const { id, checklistItemId } = req.params;
    const { item } = req.body;
    const { completed } = req.query; // Get the completed status (true or false) from query params

    if (completed === undefined) {
        return res.status(400).json({ message: 'Completed status is required' });
    }

    try {
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const checklistItem = task.checklist.id(checklistItemId);
        if (!checklistItem) {
            return res.status(404).json({ message: 'Checklist item not found' });
        }

        checklistItem.item = item !== undefined ? item : checklistItem.item;
        checklistItem.completed = completed === 'true'; // Convert to boolean based on query parameter

        const updatedTask = await task.save();
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Error updating checklist item:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});






// SignUp Route
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExist = await Register.findOne({ email });
        if (userExist) {
            return res.status(400).json({ message: 'User Already Exists' });
        }
        const encryptedPass = await bcrypt.hash(password, 10);
        const user = new Register({ name, email, password: encryptedPass });
        await user.save();

        res.status(201).json({ status: 'Success', message: 'User signed up successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: 'Failed', message: 'Internal server error' });
    }
});

// Login Route
app.post('/Login', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const user = await Register.findOne({ email }).lean();
        if (!user) {
            return res.status(400).json({ status: 'Failed', message: 'Invalid email or password' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ status: 'Failed', message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email },
            process.env.JWT_PRIVATE_KEY,
            { expiresIn: '2H' }
        );

        res.json({ status: 'Success', message: 'User logged in successfully', token, userId: user._id, name: user.name, email: user.email });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ status: 'Failed', message: 'Internal server error' });
    }
});


// Update user settings
app.put('/api/updateSettings', Auth, async (req, res) => {
    const userId = req.user.id; // Get the user ID from the Auth middleware
    const { name, email, oldPassword, newPassword } = req.body; // Include oldPassword and newPassword in the request body

    // Check how many fields are being updated
    const fieldsToUpdate = [name, email, oldPassword, newPassword].filter(field => field !== undefined && field !== '');

    // Ensure at least one field is provided
    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ error: 'At least one field must be provided for update.' });
    }

    // Limit updates to one of name, email, or password
    if (fieldsToUpdate.length > 1 && !(oldPassword && newPassword)) {
        return res.status(400).json({ error: 'You can only update one field at a time.' });
    }

    try {
        const user = await Register.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check if old password is provided and matches the stored password
        if (oldPassword && newPassword) {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Old password is incorrect.' });
            }
            // Hash the new password before saving
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword; // Update the hashed password
        }

        // Update name and email if provided
        if (name) {
            user.name = name;
        }
        if (email) {
            user.email = email;
        }

        await user.save();

        return res.status(200).json({ message: 'User settings updated successfully.' });
    } catch (error) {
        console.error('Error updating user settings:', error);
        return res.status(500).json({ error: 'Server error.' });
    }
});



// Server Initialization
server.listen(process.env.PORT, async () => {
    if (!process.env.MONGO_URL) {
        throw new Error('MONGO_URL is not defined');
    }

    await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log(`Server is up at port ${process.env.PORT} and Mongoose is connected`);
        })
        .catch((error) => console.error('Mongoose connection error:', error));
});
