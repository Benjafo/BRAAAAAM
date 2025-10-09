import { createFileRoute } from "@tanstack/react-router";

function IndexPage() {
    return <div className="p-6"></div>;
}

export const Route = createFileRoute("/")({
    component: IndexPage,
});
