import { type ReportTemplate } from "@/lib/reportTemplates";
import { http } from "@/services/auth/serviceResolver";
import { Calendar, UserCircle, Users as UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface TemplateListProps {
    onTemplateSelect: (template: ReportTemplate) => void;
}

const ENTITY_ICONS = {
    clients: <UserCircle className="w-5 h-5" />,
    users: <UsersIcon className="w-5 h-5" />,
    appointments: <Calendar className="w-5 h-5" />,
};

const ENTITY_LABELS = {
    clients: "Clients",
    users: "Users",
    appointments: "Appointments",
};

export function TemplateList({ onTemplateSelect }: TemplateListProps) {
    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const data = await http
                .get(`o/reports/templates`)
                .json<{ templates: ReportTemplate[] }>();

            setTemplates(data.templates);
        } catch (err) {
            console.error("Error fetching templates:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Group templates by entity type
    const groupedTemplates = templates.reduce(
        (acc, template) => {
            if (!acc[template.entityType]) {
                acc[template.entityType] = [];
            }
            acc[template.entityType].push(template);
            return acc;
        },
        {} as Record<string, ReportTemplate[]>
    );

    if (isLoading) {
        return <div className="text-center py-8">Loading templates...</div>;
    }

    if (templates.length === 0) {
        return (
            <div className="text-center py-12">
                <p className=" mb-2">No saved templates yet</p>
                <p className="text-sm">
                    Create a custom report and save it as a template to reuse later
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {Object.entries(groupedTemplates).map(([entityType, entityTemplates]) => (
                <div key={entityType}>
                    <div className="flex items-center gap-2 mb-3">
                        {ENTITY_ICONS[entityType as keyof typeof ENTITY_ICONS]}
                        <h4 className="font-semibold text-lg">
                            {ENTITY_LABELS[entityType as keyof typeof ENTITY_LABELS]}
                        </h4>
                        <span className="text-sm">({entityTemplates.length})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {entityTemplates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => {
                                    setSelectedTemplateId(template.id);
                                    onTemplateSelect(template);
                                }}
                                className={`
                                    p-4 rounded-lg border-2 text-left transition-all
                                    ${
                                        selectedTemplateId === template.id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200"
                                    }
                                `}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-semibold text-sm">{template.name}</h5>
                                    {template.isShared && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                            Shared
                                        </span>
                                    )}
                                </div>
                                {template.description && (
                                    <p className="text-xs  mb-2">{template.description}</p>
                                )}
                                <div className="flex items-center gap-3 text-xs">
                                    <span>{template.selectedColumns.length} columns</span>
                                    <span>•</span>
                                    <span>
                                        by {template.createdBy.firstName}{" "}
                                        {template.createdBy.lastName}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
