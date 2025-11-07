import CustomFormModal from "@/components/modals/customFormModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type CustomForm } from "@/lib/types";
import { http } from "@/services/auth/serviceResolver";
import { Calendar, FileText, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";

type EntityType = "client" | "user" | "appointment";

type CustomFormConfig = {
    type: EntityType;
    title: string;
    description: string;
    icon: typeof FileText;
};

const CUSTOM_FORMS: CustomFormConfig[] = [
    {
        type: "client",
        title: "Client Form",
        description: "Additional fields for client profiles",
        icon: Users,
    },
    {
        type: "user",
        title: "User Form",
        description: "Additional fields for user profiles",
        icon: Users,
    },
    {
        type: "appointment",
        title: "Ride Form",
        description: "Additional fields for ride bookings",
        icon: Calendar,
    },
];

export default function CustomFormsTable() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>("client");
    const [forms, setForms] = useState<CustomForm[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchForms = async () => {
        try {
            const orgID = "braaaaam"; // TODO: Get from context
            const response = await http.get(`o/${orgID}/custom-forms`).json<CustomForm[]>();
            setForms(response);
        } catch (error) {
            console.error("Failed to fetch forms:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, []);

    const handleCardClick = (entityType: EntityType) => {
        const existingForm = forms.find((f) => f.targetEntity === entityType);
        setSelectedForm(existingForm || null);
        setSelectedEntityType(entityType);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        fetchForms();
    };

    const getFormForEntity = (entityType: EntityType) => {
        return forms.find((f) => f.targetEntity === entityType);
    };

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading custom forms...</div>;
    }

    return (
        <>
            <div className="flex flex-col gap-4 w-3/4 mx-auto">
                {CUSTOM_FORMS.map((customForm) => {
                    const form = getFormForEntity(customForm.type);
                    const Icon = customForm.icon;

                    return (
                        <Card
                            key={customForm.type}
                            className="cursor-pointer hover:border-primary transition-colors h-[160px]"
                            onClick={() => handleCardClick(customForm.type)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                        <CardTitle className="text-lg">
                                            {customForm.title}
                                        </CardTitle>
                                    </div>
                                    {!form && <Plus className="w-5 h-5 text-muted-foreground" />}
                                </div>
                                <CardDescription>{customForm.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {form ? (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">
                                            Custom Fields:{" "}
                                        </span>
                                        <span className="font-medium">
                                            {form.fields?.length || 0}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Click to begin adding custom fields
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <CustomFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                defaultValues={selectedForm || undefined}
                targetEntity={selectedEntityType}
                onSuccess={handleSuccess}
            />
        </>
    );
}
