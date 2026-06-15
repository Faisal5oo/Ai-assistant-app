import mongoose from "mongoose";

const DeepWorkSessionLogSchema = new mongoose.Schema(
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
    objective: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    plannedDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 180,
    },
    actualDurationMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    objectiveAchieved: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["completed", "abandoned"],
      required: true,
    },
    abandonReason: {
      type: String,
      enum: ["cognitive_depletion", "external_friction", "dopamine_pull"],
      default: null,
    },
    completedEarly: {
      type: Boolean,
      default: false,
    },
    minutesSaved: {
      type: Number,
      default: 0,
      min: 0,
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

DeepWorkSessionLogSchema.index({ userId: 1, createdAt: -1 });
DeepWorkSessionLogSchema.index({ userId: 1, status: 1, objectiveAchieved: 1 });
DeepWorkSessionLogSchema.index({ userId: 1, abandonReason: 1 });

const DeepWorkSessionLog =
  mongoose.models.DeepWorkSessionLog ||
  mongoose.model("DeepWorkSessionLog", DeepWorkSessionLogSchema);

export default DeepWorkSessionLog;
