"use client";

import { useEffect, useState } from "react";

type Deployment = {
  deployment_id: string;
  model: "model-a" | "model-b";
  status: "provisioning" | "ready" | "terminated";
  api_key?: string;
};

type BreakdownItem = {
  group: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
};

type UsageResponse = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  total_cost: number;
  breakdown: BreakdownItem[];
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getSevenDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 7);

  return date.toISOString().split("T")[0];
}

export default function Usage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState("");

  const [from, setFrom] = useState(getSevenDaysAgo());
  const [to, setTo] = useState(getToday());
  const [groupBy, setGroupBy] = useState<"day" | "model">("day");

  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDeployments() {
      try {
        const response = await fetch("/api/deployments");

        if (!response.ok) {
          throw new Error("Failed to fetch deployments.");
        }

        const data: Deployment[] = await response.json();

        const deploymentsWithKeys = data.filter(
          (deployment) => deployment.api_key,
        );

        setDeployments(deploymentsWithKeys);

        if (deploymentsWithKeys.length > 0) {
          setSelectedDeploymentId((current) => {
            const stillExists = deploymentsWithKeys.some(
              (deployment) => deployment.deployment_id === current,
            );

            return stillExists ? current : deploymentsWithKeys[0].deployment_id;
          });
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Something went wrong.",
        );
      }
    }

    fetchDeployments();
  }, []);

  async function fetchUsage() {
    const deployment = deployments.find(
      (item) => item.deployment_id === selectedDeploymentId,
    );

    if (!deployment?.api_key) {
      setError("Please select a deployment.");
      return;
    }

    if (!from || !to) {
      setError("Please select a date range.");
      return;
    }

    if (from > to) {
      setError("'From' date cannot be after 'To' date.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setUsage(null);

      const fromDate = new Date(`${from}T00:00:00.000Z`);
      const toDate = new Date(`${to}T23:59:59.999Z`);

      const params = new URLSearchParams({
        api_key: deployment.api_key,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        group_by: groupBy,
      });

      const response = await fetch(`/api/usage?${params.toString()}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch usage.");
      }

      setUsage(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-zinc-100">Usage</h2>

        <p className="mt-1 text-sm text-zinc-400">
          Monitor token consumption and estimated API costs.
        </p>
      </div>

      {deployments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center">
          <p className="font-medium text-zinc-200">No deployments available</p>

          <p className="mt-1 text-sm text-zinc-500">
            Create a deployment before viewing usage data.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Deployment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Deployment
            </label>

            <select
              value={selectedDeploymentId}
              onChange={(e) => {
                setSelectedDeploymentId(e.target.value);
                setUsage(null);
                setError("");
              }}
              className="w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
            >
              {deployments.map((deployment) => (
                <option
                  key={deployment.deployment_id}
                  value={deployment.deployment_id}
                >
                  {deployment.model} — {deployment.deployment_id}
                </option>
              ))}
            </select>
          </div>

          {/* Filters */}
          <div className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                From
              </label>

              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none transition scheme-dark focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                To
              </label>

              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none transition scheme-dark focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Group by
              </label>

              <select
                value={groupBy}
                onChange={(e) => {
                  setGroupBy(e.target.value as "day" | "model");
                  setUsage(null);
                }}
                className="w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
              >
                <option value="day">Day</option>
                <option value="model">Model</option>
              </select>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={fetchUsage}
            disabled={loading}
            className="inline-flex min-w-32 cursor-pointer items-center justify-center rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" />
                Loading...
              </span>
            ) : (
              "Get usage"
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-lg border border-red-900/60 bg-red-950/40 p-4">
          <p className="text-sm font-medium text-red-300">
            Failed to load usage
          </p>

          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Usage Results */}
      {usage && (
        <div className="mt-7 space-y-6">
          {/* Summary */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">
                Usage summary
              </h3>

              <span className="text-xs text-zinc-500">
                {from} → {to}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Input tokens
                </p>

                <p className="mt-2 text-2xl font-semibold text-zinc-100">
                  {usage.input_tokens.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Output tokens
                </p>

                <p className="mt-2 text-2xl font-semibold text-zinc-100">
                  {usage.output_tokens.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Total tokens
                </p>

                <p className="mt-2 text-2xl font-semibold text-zinc-100">
                  {usage.total_tokens.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Estimated cost
                </p>

                <p className="mt-2 text-2xl font-semibold text-emerald-300">
                  ${usage.total_cost.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">Breakdown</h3>

              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">
                Grouped by {groupBy}
              </span>
            </div>

            {usage.breakdown.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                <p className="font-medium text-zinc-300">No usage found</p>

                <p className="mt-1 text-sm text-zinc-500">
                  No requests were recorded for the selected date range.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175 text-left text-sm">
                    <thead className="border-b border-zinc-800 bg-zinc-900">
                      <tr>
                        <th className="px-4 py-3 font-medium text-zinc-400">
                          {groupBy === "day" ? "Day" : "Model"}
                        </th>

                        <th className="px-4 py-3 font-medium text-zinc-400">
                          Input tokens
                        </th>

                        <th className="px-4 py-3 font-medium text-zinc-400">
                          Output tokens
                        </th>

                        <th className="px-4 py-3 font-medium text-zinc-400">
                          Total tokens
                        </th>

                        <th className="px-4 py-3 font-medium text-zinc-400">
                          Cost
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800">
                      {usage.breakdown.map((item) => (
                        <tr
                          key={item.group}
                          className="bg-zinc-950 transition hover:bg-zinc-900/70"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-200">
                            {item.group}
                          </td>

                          <td className="px-4 py-3 text-zinc-400">
                            {item.input_tokens.toLocaleString()}
                          </td>

                          <td className="px-4 py-3 text-zinc-400">
                            {item.output_tokens.toLocaleString()}
                          </td>

                          <td className="px-4 py-3 text-zinc-300">
                            {item.total_tokens.toLocaleString()}
                          </td>

                          <td className="px-4 py-3 font-mono text-emerald-300">
                            ${item.cost.toFixed(6)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
