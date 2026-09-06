"use client";

import { useEffect, useState } from "react";

type Deployment = {
  deployment_id: string;
  model: "model-a" | "model-b";
  status: "provisioning" | "ready" | "terminated";
  endpoint_url?: string;
  api_key?: string;
};

type CompletionResponse = {
  output: string;
  input_tokens: number;
  output_tokens: number;
};

export default function Playground() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<CompletionResponse | null>(null);

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

        const readyDeployments = data.filter(
          (deployment) => deployment.status === "ready",
        );

        setDeployments(readyDeployments);

        if (readyDeployments.length > 0) {
          setSelectedDeploymentId((current) => {
            const stillExists = readyDeployments.some(
              (deployment) => deployment.deployment_id === current,
            );

            return stillExists ? current : readyDeployments[0].deployment_id;
          });
        } else {
          setSelectedDeploymentId("");
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Something went wrong.",
        );
      }
    }

    fetchDeployments();

    const interval = setInterval(fetchDeployments, 2000);

    return () => clearInterval(interval);
  }, []);

  async function sendPrompt() {
    if (!selectedDeploymentId) {
      setError("Please select a ready deployment.");
      return;
    }

    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    const deployment = deployments.find(
      (item) => item.deployment_id === selectedDeploymentId,
    );

    if (!deployment?.api_key) {
      setError("API key is unavailable for this deployment.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await fetch(
        `/api/v1/${selectedDeploymentId}/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deployment.api_key}`,
          },
          body: JSON.stringify({
            prompt,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Request failed with status ${response.status}.`,
        );
      }

      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-zinc-300">Playground</h2>

        <p className="mt-1 text-sm text-zinc-500">
          Send a prompt to one of your ready deployments.
        </p>
      </div>

      {deployments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="font-medium text-zinc-700">No ready deployments</p>

          <p className="mt-1 text-sm text-zinc-500">
            Create a deployment and wait for it to finish provisioning.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Deployment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">
              Deployment
            </label>

            <select
              value={selectedDeploymentId}
              onChange={(e) => {
                setSelectedDeploymentId(e.target.value);
                setResult(null);
                setError("");
              }}
              className="w-full cursor-pointer rounded-lg border border-zinc-300 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-300 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
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

          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-400">
                Prompt
              </label>

              <span className="text-xs text-zinc-400">
                {prompt.length} characters
              </span>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Explain closures in JavaScript..."
              rows={6}
              className="w-full resize-y rounded-lg border border-zinc-300 bg-zinc-900 p-3 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          {/* Send */}
          <div className="flex items-center gap-3">
            <button
              onClick={sendPrompt}
              disabled={loading || !prompt.trim()}
              className="inline-flex min-w-32 cursor-pointer items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sending...
                </span>
              ) : (
                "Send request"
              )}
            </button>

            {prompt && !loading && (
              <button
                type="button"
                onClick={() => {
                  setPrompt("");
                  setResult(null);
                  setError("");
                }}
                className="cursor-pointer text-sm text-zinc-500 transition hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">Request failed</p>

          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Response */}
      {result && (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500" />

              <h3 className="text-sm font-semibold text-zinc-400">Response</h3>
            </div>

            <span className="text-xs font-medium text-green-500">200 OK</span>
          </div>

          <div className="p-4">
            <div className="rounded-lg bg-zinc-950 p-4">
              <pre className="whitespace-pre-wrap wrap-break-word font-mono text-sm text-zinc-100">
                {result.output}
              </pre>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-800 p-3">
                <p className="text-xs text-zinc-300">Input tokens</p>

                <p className="mt-1 text-lg font-semibold text-zinc-300">
                  {result.input_tokens}
                </p>
              </div>

              <div className="rounded-lg bg-zinc-800 p-3">
                <p className="text-xs text-zinc-300">Output tokens</p>

                <p className="mt-1 text-lg font-semibold text-zinc-300">
                  {result.output_tokens}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
