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
  },
  {
    versionKey: false,
  }
);

const UserDashboard =
  mongoose.models.UserDashboard ||
  mongoose.model("UserDashboard", UserDashboardSchema);

export default UserDashboard;
