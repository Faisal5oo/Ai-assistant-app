import mongoose from "mongoose";

const DailyTimeLogSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    totalMs: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const PomodoroDailySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    completed: {
      type: Number,
      default: 0,
      min: 0,
    },
    goal: {
      type: Number,
      default: 4,
      min: 1,
    },
  },
  { _id: false }
);

const ActiveFocusSessionSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true },
    isRunning: { type: Boolean, default: false },
    startedAt: { type: Number, default: 0 },
    elapsedMs: { type: Number, default: 0, min: 0 },
    mode: {
      type: String,
      enum: ["work", "pomodoro", "deep-work", "flow"],
      default: "work",
    },
    targetMs: { type: Number },
    activeTechnique: { type: String, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ActiveDeepWorkSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    taskId: { type: String, required: true },
    taskTitle: { type: String, required: true },
    objective: { type: String, required: true, maxlength: 200 },
    durationMinutes: { type: Number, required: true, min: 60, max: 120 },
    phase: { type: String, enum: ["active", "recap"], default: "active" },
    timerRunning: { type: Boolean, default: false },
    timerStartedAt: { type: Number, default: null },
    endsAt: { type: Number, default: null },
    committedAt: { type: Number, required: true },
    distractions: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const DeepWorkDailySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    sessionsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    breakthroughsAchieved: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const UserDashboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    dailyLogs: {
      type: [DailyTimeLogSchema],
      default: [],
    },
    pomodoroDaily: {
      type: PomodoroDailySchema,
      required: true,
    },
    activeFocusSession: {
      type: ActiveFocusSessionSchema,
      default: undefined,
    },
    activeDeepWorkSession: {
      type: ActiveDeepWorkSessionSchema,
      default: undefined,
    },
    deepWorkDaily: {
      type: DeepWorkDailySchema,
      default: undefined,
    },
  },
  {
    versionKey: false,
  }
);

const UserDashboard =
  mongoose.models.UserDashboard ||
  mongoose.model("UserDashboard", UserDashboardSchema);

export default UserDashboard;
