import { NextResponse } from "next/server";
import { UsageEvent } from "@/models/UsageEvent";
import { connectDB } from "@/lib/mongoDB";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const apiKey = searchParams.get("api_key");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const groupBy = searchParams.get("group_by");

    if (!apiKey) {
      return NextResponse.json(
        { error: "api_key is required." },
        { status: 400 },
      );
    }

    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to are required." },
        { status: 400 },
      );
    }

    if (!["day", "model"].includes(groupBy || "")) {
      return NextResponse.json(
        { error: "group_by must be day or model." },
        { status: 400 },
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date range." },
        { status: 400 },
      );
    }

    const groupId =
      groupBy === "day"
        ? {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          }
        : "$model";

    const groupedUsage = await UsageEvent.aggregate([
      {
        $match: {
          apiKey,
          timestamp: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
      {
        $group: {
          _id: groupId,
          inputTokens: {
            $sum: "$inputTokens",
          },
          outputTokens: {
            $sum: "$outputTokens",
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const breakdown = groupedUsage.map((item) => {
      const totalTokens = item.inputTokens + item.outputTokens;

      const inputCost = (item.inputTokens / 1000) * 0.001;

      const outputCost = (item.outputTokens / 1000) * 0.002;

      return {
        group: item._id,
        input_tokens: item.inputTokens,
        output_tokens: item.outputTokens,
        total_tokens: totalTokens,
        cost: Number((inputCost + outputCost).toFixed(6)),
      };
    });

    const totals = breakdown.reduce(
      (acc, item) => {
        acc.inputTokens += item.input_tokens;
        acc.outputTokens += item.output_tokens;
        acc.totalTokens += item.total_tokens;
        acc.totalCost += item.cost;

        return acc;
      },
      {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
      },
    );

    return NextResponse.json({
      input_tokens: totals.inputTokens,
      output_tokens: totals.outputTokens,
      total_tokens: totals.totalTokens,
      total_cost: Number(totals.totalCost.toFixed(6)),
      breakdown,
    });
  } catch (error) {
    console.error("Usage error:", error);

    return NextResponse.json(
      { error: "Failed to fetch usage." },
      { status: 500 },
    );
  }
}
