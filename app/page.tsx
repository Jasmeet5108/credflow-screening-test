import Deployments from "@/components/Deployments";
import Playground from "@/components/Playground";
import Usage from "@/components/Usage";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl space-y-12 p-8">
      <div>
        <h1 className="text-3xl font-bold">Usage API Platform</h1>

        <p className="mt-2 text-gray-400">
          Deploy models, send completion requests, and monitor usage.
        </p>
      </div>

      <Deployments />

      <hr />

      <Playground />

      <hr />

      <Usage />
    </main>
  );
}
