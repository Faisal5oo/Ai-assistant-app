import mongoose from "mongoose";

const BatchSprintLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    batchCategory: {
      type: String,
      required: true,
      maxlength: 64,
      index: true,
    },
    bucketTitle: {
      type: String,
      required: true,
      maxlength: 100,
    },
    sessionStartedAt: {
      type: Date,
      required: true,
    },
    durationMs: {
      type: Number,
      required: true,
      min: 0,
    },
    tasksTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tasksCompleted: {
      type: Number,
      required: true,
      min: 0,
    },
    tasksSkipped: {
      type: Number,
      required: true,
      min: 0,
    },
    focusEfficiency: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["completed", "abandoned"],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

BatchSprintLogSchema.index({ userId: 1, createdAt: -1 });
BatchSprintLogSchema.index({ userId: 1, batchCategory: 1, createdAt: -1 });

const BatchSprintLog =
  mongoose.models.BatchSprintLog ||
  mongoose.model("BatchSprintLog", BatchSprintLogSchema);

export default BatchSprintLog;
