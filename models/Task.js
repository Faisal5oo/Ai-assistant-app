import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: ["Work", "Personal", "Learning", "Health"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Todo", "In-Progress", "Completed"],
      default: "Todo",
      index: true,
    },
    estimatedTime: {
      type: Number,
      required: true,
      min: 1,
      max: 24 * 60,
    },
    actualTimeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    scheduledAt: {
      type: Date,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    eisenhowerQuadrant: {
      type: Number,
      enum: [1, 2, 3, 4],
    },
    delegateTo: {
      type: String,
      maxlength: 100,
    },
    automateCandidate: {
      type: Boolean,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

TaskSchema.index({ userId: 1, status: 1, sortOrder: 1 });

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export default Task;
