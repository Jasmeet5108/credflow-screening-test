export function calculateUsageCost(inputTokens: number, outputTokens: number) {
  const inputCost = (inputTokens / 1000) * 0.001;
  const outputCost = (outputTokens / 1000) * 0.002;

  return inputCost + outputCost;
}
