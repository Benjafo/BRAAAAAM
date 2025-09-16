import { createFileRoute } from "@tanstack/react-router";
import CreateRideModal from "@/components/modals/createRideModal";
import EditRideModal, { type Ride } from "@/components/modals/editRideModal";

function IndexPage() {
  // demo data so the modal has something to show
  const demoRide: Ride = {
    id: "r1",
    clientName: "Client Name (uneditable)",
    driverName: "Driver Name (uneditable)",
    dispatcherName: "Dispatcher Name (uneditable)",
    numClients: 0,
    status: "scheduled",
    durationHours: 0.75,
    distanceMilesTenths: 25.0,
    donationType: "Check",
    donationAmount: 15.0,
  };

  return (
    <div className="p-6 flex gap-3">
      <CreateRideModal />
      {/* <- THIS is what was missing */}
      <EditRideModal
        ride={demoRide}
        onSave={(updated) => console.log("EDIT SAVE", updated)}
      />
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});

