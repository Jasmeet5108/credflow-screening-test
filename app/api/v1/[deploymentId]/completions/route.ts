import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { UsageEvent } from "@/models/UsageEvent";
import { connectDB } from "@/lib/mongoDB";
import { Deployment } from "@/models/deployment";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deploymentId: string }> },
) {
  try {
    await connectDB();

    const { deploymentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(deploymentId)) {
      return NextResponse.json(
        { error: "Invalid deployment ID." },
        { status: 400 },
      );
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header." },
        { status: 401 },
      );
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();

    const deployment = await Deployment.findById(deploymentId);

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found." },
        { status: 404 },
      );
    }

    const keyExists = await Deployment.exists({ apiKey });

    if (!keyExists) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    }

    if (deployment.apiKey !== apiKey) {
      return NextResponse.json(
        { error: "API key does not match this deployment." },
        { status: 403 },
      );
    }

    if (deployment.status !== "ready") {
      return NextResponse.json(
        {
          error:
            deployment.status === "terminated"
              ? "Deployment is terminated."
              : "Deployment is still provisioning.",
        },
        { status: 409 },
      );
    }

    const rateLimit = checkRateLimit(apiKey);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Maximum 100 requests per minute.",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const inputTokens = Math.round(prompt.length / 4);

    const outputTokens = Math.floor(Math.random() * (200 - 50 + 1)) + 50;

    await UsageEvent.create({
      apiKey,
      deploymentId,
      model: deployment.model,
      inputTokens,
      outputTokens,
      timestamp: new Date(),
    });

    return NextResponse.json({
      output: "mocked response",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    });
  } catch (error) {
    console.error("Completion error:", error);

    return NextResponse.json(
      { error: "Failed to process completion request." },
      { status: 500 },
    );
  }
}
