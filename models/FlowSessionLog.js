import mongoose from "mongoose";

const FlowSessionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    primaryTaskId: { type: String, required: true },
    primaryTaskTitle: { type: String, required: true, maxlength: 200 },
    targetTaskIds: { type: [String], default: [] },
    runwayQueue: { type: [String], default: [] },
    durationMinutes: { type: Number, required: true, min: 1, max: 180 },
    actualDurationMs: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["completed", "abandoned"],
      required: true,
    },
    sessionStartedAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

FlowSessionLogSchema.index({ userId: 1, sessionStartedAt: -1 });

const FlowSessionLog =
  mongoose.models.FlowSessionLog ||
  mongoose.model("FlowSessionLog", FlowSessionLogSchema);

export default FlowSessionLog;
