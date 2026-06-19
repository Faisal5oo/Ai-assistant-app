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

const ActiveBatchSprintSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, maxlength: 64 },
    phase: { type: String, enum: ["execution", "recap"], required: true },
    startedAt: { type: Number, required: true },
    queue: { type: [String], default: [] },
    completedIds: { type: [String], default: [] },
    skippedCount: { type: Number, default: 0, min: 0 },
    initialQueueLength: { type: Number, default: 0, min: 0 },
    finalElapsedMs: { type: Number, default: 0, min: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ActivePomodoroTimerSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    taskId: { type: String, default: null },
    phase: {
      type: String,
      enum: ["work", "shortBreak", "longBreak"],
      required: true,
    },
    type: {
      type: String,
      enum: ["focus", "short_break", "long_break"],
      required: true,
    },
    secondsLeft: { type: Number, required: true, min: 0 },
    isRunning: { type: Boolean, default: false },
    workMinutes: { type: Number, default: 25, min: 1, max: 180 },
    cycle: { type: Number, default: 0, min: 0 },
    startedAt: { type: String, required: true },
    timerStartedAt: { type: Number, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ActiveTimeBlockRunwaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    hour: { type: Number, required: true, min: 0, max: 23 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ActiveFlowSessionSchema = new mongoose.Schema(
  {
    primaryTaskId: { type: String, required: true },
    primaryTaskTitle: { type: String, required: true, maxlength: 200 },
    targetTaskIds: { type: [String], default: [] },
    /** Unpacked execution queue: ordered task ids resolved from tasks + batch categories */
    runwayQueue: { type: [String], default: [] },
    durationMinutes: { type: Number, required: true, min: 1, max: 180 },
    startedAt: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now },
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
    activeBatchSprint: {
      type: ActiveBatchSprintSchema,
      default: undefined,
    },
    activePomodoroTimer: {
      type: ActivePomodoroTimerSchema,
      default: undefined,
    },
    activeTimeBlockRunway: {
      type: ActiveTimeBlockRunwaySchema,
      default: undefined,
    },
    activeFlowSession: {
      type: ActiveFlowSessionSchema,
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
