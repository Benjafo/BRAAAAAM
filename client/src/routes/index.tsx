import { createFileRoute } from "@tanstack/react-router";

function IndexPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Welcome</h1>
      <p className="mt-2 text-muted-foreground">
        This is the home page. Use the navigation to access features.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});