import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongoDB";
import { Deployment } from "@/models/deployment";
import {
  PROVISIONING_TIME_MS,
  shouldMarkDeploymentReady,
} from "@/lib/deployment";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const { model } = body;

    if (!["model-a", "model-b"].includes(model)) {
      return NextResponse.json(
        {
          error: "Invalid model. Use model-a or model-b.",
        },
        {
          status: 400,
        },
      );
    }

    const apiKey = `sk_${crypto.randomBytes(24).toString("hex")}`;

    const deployment = await Deployment.create({
      model,
      status: "provisioning",
      apiKey,
    });

    return NextResponse.json(
      {
        deployment_id: deployment._id.toString(),
        status: deployment.status,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create deployment error:", error);

    return NextResponse.json(
      {
        error: "Failed to create deployment.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const deployments = await Deployment.find().sort({
      createdAt: -1,
    });

    for (const deployment of deployments) {
      if (shouldMarkDeploymentReady(deployment.status, deployment.createdAt)) {
        deployment.status = "ready";
        deployment.endpointUrl = `/api/v1/${deployment._id.toString()}/completions`;

        await deployment.save();
      }
    }

    const result = deployments.map((deployment) => ({
      deployment_id: deployment._id.toString(),
      model: deployment.model,
      status: deployment.status,

      ...(deployment.status === "ready"
        ? {
            endpoint_url: deployment.endpointUrl,
            api_key: deployment.apiKey,
          }
        : {}),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("List deployments error:", error);

    return NextResponse.json(
      { error: "Failed to fetch deployments." },
      { status: 500 },
    );
  }
}
