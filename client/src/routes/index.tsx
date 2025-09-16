import { createFileRoute } from "@tanstack/react-router"
import CreateRideModal from "@/components/modals/createRideModal" // adjust case to match your filename

function IndexPage() {
  return (
    <div className="p-6">
      <CreateRideModal />
    </div>
  )
}

export const Route = createFileRoute("/")({
  component: IndexPage,
})
