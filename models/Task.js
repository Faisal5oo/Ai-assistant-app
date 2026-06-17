import mongoose from "mongoose";

const TimeLogSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, required: true },
    stoppedAt: { type: Date, required: true },
  },
  { _id: false }
);

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
    completedPomodoros: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastWorkedAt: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    scheduledAt: {
      type: Date,
    },
    timeBlockAllocations: {
      type: [
        {
          date: { type: String, required: true },
          hour: { type: Number, required: true, min: 0, max: 23 },
          durationMinutes: {
            type: Number,
            required: true,
            min: 1,
            max: 60,
          },
        },
      ],
      default: [],
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
    batchCategory: {
      type: String,
      default: null,
      maxlength: 64,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    timeLogs: {
      type: [TimeLogSchema],
      default: [],
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
TaskSchema.index({ userId: 1, completedAt: 1 });
TaskSchema.index({ userId: 1, category: 1 });

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export default Task;
