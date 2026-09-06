"use client";

import { useEffect, useState } from "react";

type Deployment = {
  deployment_id: string;
  model: "model-a" | "model-b";
  status: "provisioning" | "ready" | "terminated";
  endpoint_url?: string;
  api_key?: string;
};

export default function Deployments() {
  const [model, setModel] = useState<"model-a" | "model-b">("model-a");

  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedDeploymentId, setCopiedDeploymentId] = useState<string | null>(
    null,
  );

  const fetchDeployments = async () => {
    try {
      const response = await fetch("/api/deployments");

      if (!response.ok) {
        throw new Error("Failed to fetch deployments.");
      }

      const data = await response.json();

      setDeployments(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  };

  useEffect(() => {
    fetchDeployments();

    const interval = setInterval(() => {
      fetchDeployments();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const createDeployment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/deployments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create deployment.");
      }

      await fetchDeployments();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  async function terminateDeployment(id: string) {
    try {
      setError("");

      const response = await fetch(`/api/deployments/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to terminate deployment.");
      }

      await fetchDeployments();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">Deployments</h2>

          <p className="mt-1 text-sm text-zinc-400">
            Create and manage your model deployments.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as "model-a" | "model-b")}
            className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
          >
            <option value="model-a">model-a</option>
            <option value="model-b">model-b</option>
          </select>

          <button
            onClick={createDeployment}
            disabled={loading}
            className="inline-flex min-w-40 cursor-pointer items-center justify-center rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" />
                Creating...
              </span>
            ) : (
              "Create deployment"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-900/60 bg-red-950/40 p-4">
          <p className="text-sm font-medium text-red-300">
            Something went wrong
          </p>

          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
      )}

      {deployments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center">
          <p className="font-medium text-zinc-200">No deployments yet</p>

          <p className="mt-1 text-sm text-zinc-500">
            Choose a model and create your first deployment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {deployments.map((deployment) => {
            const isReady = deployment.status === "ready";
            const isProvisioning = deployment.status === "provisioning";
            const isTerminated = deployment.status === "terminated";

            return (
              <div
                key={deployment.deployment_id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">Model</p>

                    <p className="mt-1 font-medium text-zinc-100">
                      {deployment.model}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      isReady
                        ? "border-emerald-900 bg-emerald-950/50 text-emerald-300"
                        : isProvisioning
                          ? "border-amber-900 bg-amber-950/50 text-amber-300"
                          : "border-red-900 bg-red-950/50 text-red-300"
                    }`}
                  >
                    {deployment.status}
                  </span>
                </div>

                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <p className="text-xs text-zinc-500">Deployment ID</p>

                  <p className="mt-1 break-all font-mono text-xs text-zinc-300">
                    {deployment.deployment_id}
                  </p>
                </div>

                {isProvisioning && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-sm text-amber-300">
                      <span className="size-3 animate-spin rounded-full border-2 border-amber-900 border-t-amber-300" />
                      Provisioning deployment...
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                      This usually takes around 10 seconds.
                    </p>
                  </div>
                )}

                {isReady && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs text-zinc-500">Endpoint</p>

                      <div className="mt-1 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <p className="break-all font-mono text-xs text-zinc-300">
                          {deployment.endpoint_url}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">API Key</p>

                      <div className="mt-1 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <p className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300">
                          {deployment.api_key}
                        </p>

                        <button
                          onClick={() => {
                            navigator.clipboard
                              .writeText(deployment.api_key || "")
                              .then(() => {
                                setCopiedDeploymentId(deployment.deployment_id);

                                setTimeout(() => {
                                  setCopiedDeploymentId(null);
                                }, 1000);
                              });
                          }}
                          className="shrink-0 cursor-pointer rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                        >
                          {copiedDeploymentId === deployment.deployment_id
                            ? "Copied"
                            : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isTerminated && (
                  <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 p-3">
                    <p className="text-sm text-red-300">
                      This deployment has been terminated.
                    </p>
                  </div>
                )}

                {!isTerminated && (
                  <div className="mt-5 flex justify-end border-t border-zinc-800 pt-4">
                    <button
                      onClick={() =>
                        terminateDeployment(deployment.deployment_id)
                      }
                      className="cursor-pointer rounded-lg border border-red-900/70 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-950/70 hover:text-red-200"
                    >
                      Terminate
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
