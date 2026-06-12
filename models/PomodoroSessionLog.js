import mongoose from "mongoose";

const PomodoroSessionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["focus", "short_break", "long_break"],
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
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

PomodoroSessionLogSchema.index({ userId: 1, createdAt: -1 });
PomodoroSessionLogSchema.index({ userId: 1, type: 1, status: 1 });

const PomodoroSessionLog =
  mongoose.models.PomodoroSessionLog ||
  mongoose.model("PomodoroSessionLog", PomodoroSessionLogSchema);

export default PomodoroSessionLog;
