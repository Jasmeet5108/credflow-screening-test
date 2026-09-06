import { Schema, model, models } from "mongoose";

export interface IUsageEvent {
  apiKey: string;
  deploymentId: string;
  model: "model-a" | "model-b";
  inputTokens: number;
  outputTokens: number;
  timestamp: Date;
}

const usageEventSchema = new Schema<IUsageEvent>({
  apiKey: {
    type: String,
    required: true,
    index: true,
  },

  deploymentId: {
    type: String,
    required: true,
    index: true,
  },

  model: {
    type: String,
    enum: ["model-a", "model-b"],
    required: true,
  },

  inputTokens: {
    type: Number,
    required: true,
  },

  outputTokens: {
    type: Number,
    required: true,
  },

  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export const UsageEvent =
  models.UsageEvent || model<IUsageEvent>("UsageEvent", usageEventSchema);
