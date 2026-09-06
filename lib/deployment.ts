export const PROVISIONING_TIME_MS = 10_000;

export function shouldMarkDeploymentReady(
  status: string,
  createdAt: Date,
  now = Date.now(),
) {
  return (
    status === "provisioning" &&
    now - createdAt.getTime() >= PROVISIONING_TIME_MS
  );
}
