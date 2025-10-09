import CreateRideModal from "@/components/modals/createRideModal";

import { createFileRoute } from "@tanstack/react-router";

function IndexPage() {
    return (
        <div className="p-6">
            <CreateRideModal />
        </div>
    );
}

export const Route = createFileRoute("/")({
    component: IndexPage,
});
