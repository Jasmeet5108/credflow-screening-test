import mongoose, { Schema, model, models } from "mongoose";

export interface IDeployment {
  model: "model-a" | "model-b";
  status: "provisioning" | "ready" | "terminated";
  apiKey: string;
  endpointUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  terminatedAt?: Date;
}

const deploymentSchema = new Schema<IDeployment>(
  {
    model: {
      type: String,
      enum: ["model-a", "model-b"],
      required: true,
    },

    status: {
      type: String,
      enum: ["provisioning", "ready", "terminated"],
      default: "provisioning",
    },

    apiKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    endpointUrl: {
      type: String,
    },

    terminatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const Deployment =
  models.Deployment || model<IDeployment>("Deployment", deploymentSchema);
