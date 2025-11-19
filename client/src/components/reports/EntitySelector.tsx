import { BookmarkCheck, Calendar, Clock, Phone, UserCircle, Users } from "lucide-react";

type EntityType = "clients" | "users" | "appointments" | "volunteerRecords" | "callLogs" | "templates";

interface EntityOption {
    value: EntityType;
    label: string;
    description: string;
    icon: React.ReactNode;
}

interface EntitySelectorProps {
    selectedEntity: EntityType;
    onEntityChange: (entity: EntityType) => void;
}

const ENTITY_OPTIONS: EntityOption[] = [
    {
        value: "clients",
        label: "Clients",
        description: "Export client profiles with contact info, addresses, and demographics",
        icon: <UserCircle className="w-6 h-6" />,
    },
    {
        value: "users",
        label: "Users",
        description: "Export user accounts with roles, status, and profile information",
        icon: <Users className="w-6 h-6" />,
    },
    {
        value: "appointments",
        label: "Appointments",
        description: "Export ride data including client, driver, and location details",
        icon: <Calendar className="w-6 h-6" />,
    },
    {
        value: "volunteerRecords",
        label: "Volunteer Records",
        description: "Export volunteer hours and miles with volunteer information",
        icon: <Clock className="w-6 h-6" />,
    },
    {
        value: "callLogs",
        label: "Call Logs",
        description: "Export call log records with caller info and call details",
        icon: <Phone className="w-6 h-6" />,
    },
    {
        value: "templates",
        label: "Saved Templates",
        description: "Load a saved report template with pre-configured columns",
        icon: <BookmarkCheck className="w-6 h-6" />,
    },
];

export function EntitySelector({ selectedEntity, onEntityChange }: EntitySelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ENTITY_OPTIONS.map((option) => {
                const isSelected = selectedEntity === option.value;

                return (
                    <button
                        key={option.value}
                        onClick={() => onEntityChange(option.value)}
                        className={`
                            p-4 rounded-lg border-2 transition-all text-left
                            ${
                                isSelected
                                    ? "border-blue-500 bg-blue-50"
                                    : "bg-secondary border-gray-200 hover:border-gray-300"
                            }
                        `}
                    >
                        <div className="flex items-start space-x-3">
                            <div
                                className={`
                                flex-shrink-0 p-2 rounded-lg
                                ${isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 "}
                            `}
                            >
                                {option.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4
                                    className={`
                                    text-sm font-semibold
                                    ${isSelected ? "text-blue-900" : "text-gray-900"}
                                `}
                                >
                                    {option.label}
                                </h4>
                                <p className="text-xs  mt-1">{option.description}</p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
