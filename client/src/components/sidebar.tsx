import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="flex flex-col justify-between h-screen w-56 bg-[#5A0A0A] text-white">
      {/* Top Section */}
      <div>
        {/* Circle Placeholder */}
        <div className="flex justify-center mt-6">
          <div className="w-32 h-32 rounded-full bg-gray-200"></div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex flex-col gap-4 px-4 text-sm font-medium">
          <a
            href="#"
            className={cn(
              "flex items-center rounded-md px-2 py-2 hover:bg-[#6e1c1c] cursor-pointer"
            )}
          >
            New Ride
          </a>
          <a
            href="#"
            className="flex items-center rounded-md px-2 py-2 hover:bg-[#6e1c1c] cursor-pointer"
          >
            Upcoming Rides
          </a>
          <a
            href="#"
            className="flex items-center rounded-md px-2 py-2 hover:bg-[#6e1c1c] cursor-pointer"
          >
            Past Rides
          </a>
          <a
            href="#"
            className="flex items-center rounded-md px-2 py-2 hover:bg-[#6e1c1c] cursor-pointer"
          >
            Clients
          </a>
          <a
            href="#"
            className="flex items-center rounded-md px-2 py-2 hover:bg-[#6e1c1c] cursor-pointer"
          >
            Drivers
          </a>
          <a
            href="#"
            className="flex items-center rounded-md px-2 py-2 hover:bg-[#6e1c1c] cursor-pointer"
          >
            Volunteers
          </a>
          <a
            href="#"
            className="flex items-center rounded-md px-2 py-2 hover:bg-[#6e1c1c] cursor-pointer"
          >
            Reports
          </a>
          <a
            href="#"
            className="flex items-center rounded-md px-2 py-2 hover:bg-[#6e1c1c] cursor-pointer"
          >
            Organization Settings
          </a>
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4">
        <Button
          variant="secondary"
          className="w-full bg-black text-white hover:bg-gray-900 rounded-md flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
