export interface ReportTemplate {
    id: string;
    name: string;
    description: string | null;
    entityType: "clients" | "users" | "appointments" | "volunteerRecords" | "callLogs";
    selectedColumns: string[]; // Array of column keys
    isShared: boolean;
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateReportTemplateInput {
    name: string;
    description?: string;
    entityType: "clients" | "users" | "appointments" | "volunteerRecords" | "callLogs";
    selectedColumns: string[];
    isShared?: boolean;
}

export interface UpdateReportTemplateInput extends Partial<CreateReportTemplateInput> {}
