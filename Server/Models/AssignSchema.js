const mongoose = require('mongoose');
const Manageuser = require('../Models/User')


// Define the Task schema
const assignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Manageuser, // Reference to the User schema (creator)
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Manageuser, // Reference to the User schema (assignee)
    required: false,
  },
  priority: {
    type: String,
    enum: ['LOW PRIORITY', 'MODERATE PRIORITY', 'HIGH PRIORITY',],
    required: true,
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done', 'Backlog'],
    default: 'To Do',
  },
  dueDate: {
    type: Date,
    required: false,
  },
  checklist: [{
    item: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Assign', assignSchema);
