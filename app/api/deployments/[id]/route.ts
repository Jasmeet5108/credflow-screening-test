import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoDB";
import { Deployment } from "@/models/deployment";
import { shouldMarkDeploymentReady } from "@/lib/deployment";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid deployment ID." },
        { status: 400 },
      );
    }

    const deployment = await Deployment.findById(id);

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found." },
        { status: 404 },
      );
    }

    if (shouldMarkDeploymentReady(deployment.status, deployment.createdAt)) {
      deployment.status = "ready";
      deployment.endpointUrl = `/api/v1/${deployment._id.toString()}/completions`;

      await deployment.save();
    }

    const response: {
      deployment_id: string;
      model: string;
      status: string;
      endpoint_url?: string;
      api_key?: string;
    } = {
      deployment_id: deployment._id.toString(),
      model: deployment.model,
      status: deployment.status,
    };

    if (deployment.status === "ready") {
      response.endpoint_url = deployment.endpointUrl;
      response.api_key = deployment.apiKey;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get deployment error:", error);

    return NextResponse.json(
      { error: "Failed to fetch deployment." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid deployment ID." },
        { status: 400 },
      );
    }

    const deployment = await Deployment.findById(id);

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found." },
        { status: 404 },
      );
    }

    if (deployment.status === "terminated") {
      return NextResponse.json(
        { error: "Deployment is already terminated." },
        { status: 409 },
      );
    }

    deployment.status = "terminated";
    deployment.terminatedAt = new Date();

    await deployment.save();

    return NextResponse.json({
      deployment_id: deployment._id.toString(),
      status: deployment.status,
    });
  } catch (error) {
    console.error("Delete deployment error:", error);

    return NextResponse.json(
      { error: "Failed to terminate deployment." },
      { status: 500 },
    );
  }
}
