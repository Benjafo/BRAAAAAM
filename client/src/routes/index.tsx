import { createFileRoute } from "@tanstack/react-router";

// Modals
import CreateRideModal from "@/components/modals/createRideModal";
import EditRideModal, { type Ride } from "@/components/modals/editRideModal";
import TempUnavailabilityModal from "@/components/modals/tempUnavailablilityModal";
import RecurringUnavailabilityModal from "@/components/modals/recurringUnavailabilityModal";

function IndexPage() {
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
    <div className="p-6 flex gap-3 flex-wrap">
      <CreateRideModal />
      <EditRideModal ride={demoRide} onSave={(u) => console.log("EDIT SAVE", u)} />
      <TempUnavailabilityModal onSave={(u) => console.log("UNAVAIL SAVE (temp)", u)} />
      <RecurringUnavailabilityModal onSave={(u) => console.log("UNAVAIL SAVE (recurring)", u)} />
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});
