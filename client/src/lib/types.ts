export type Permission = {
    id: string;
    permKey: string;
    resource: string;
    action: string;
    name: string;
    description: string;
};

export type Role = {
    id: string;
    roleKey: string;
    name: string;
    description: string;
    isSystem: boolean;
    permissionCount: number;
    createdAt: string;
};

export type RoleDetail = {
    id: string;
    roleName: string;
    description: string;
    isSystem: boolean;
    permissions: Permission[];
    permissionIds: string[];
};

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: Permission[];
}

export type ClientProfile = {
    address: string;
    address2?: string;
    zip: string;
    city: string;
    state: string;
    typeOfResidence?: string;
    emailAddress?: string;
    primaryPhone: string;
    secondaryPhone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    relationshipToClient?: string;
    mobilityAssistance?: string;
    otherLimitations?: string;
    vehicleTypeNeeded?: string;
    serviceAnimal?: string;
    oxygen?: string;
    allergies?: string;
    pickUpInstructions?: string;
    commentsFromProfile?: string;
};

// export interface AuthResponse {
//     user: User;
//     token: string;
// }

// export interface SignInRequest {
//     email: string;
//     password: string;
// }

export type RefreshAccessTokenRequest = {
    message?: string;
    accessToken: string;
};

export type Credentials = { email: string; password: string };

// export type Permission = 'read' | 'write' | 'publish' | 'admin';

// export type LoginResponse = {
//     user: User;
//     role: string;
//     permissions: Permission[];
//     accessToken: string;
//     refreshToken?: string;
// };

export type LoginResponse = {
    subdomain?: string;
    user: User;
    role: string;
    permissions: {
        permKey: string;
        roleGrant: boolean | null;
        userGrant: boolean | null;
        effective: boolean;
    }[];
    accessToken: string;
    refreshToken?: string;
    message?: string;
};

export type RefreshResponse = {
    accessToken: string;
    refreshToken?: string;
};

export type ForgotPasswordResponse = {
    redactedEmail: string;
    expiresAt: string;
    message?: string;
};

export type ResetPasswordCredentials = {
    newPassword: string;
    confirmNewPassword: string;
};

export interface AuthService {
    login(form: Credentials): Promise<LoginResponse>;
    logout(): Promise<void>;
    resetPassword(form: ResetPasswordCredentials & { token: string, id: string }): Promise<void>;
    forgotPassword(form: { email: string }): Promise<ForgotPasswordResponse>;
    refresh?(refreshToken: string): Promise<RefreshResponse>;
}
export type Location = {
    placeId: string;
    address: string;
    addressComponents?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
    };
    coordinates: {
        lat: number;
        lng: number;
    };
};

export type LocationSelectorProps = {
    onLocationSelect: (location: Location | null) => void;
    placeholder?: string;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
};

// Custom Forms Types
export type FieldType =
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "select"
    | "radio"
    | "checkbox"
    | "checkboxGroup";

export type FieldOption = {
    label: string;
    value: string;
};

export type ValidationRules = {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    email?: boolean;
    url?: boolean;
};

export type ConditionalLogic = {
    showIf?: {
        fieldKey: string;
        operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan";
        value: string | number | boolean;
    };
};

export type CustomFormField = {
    id: string;
    formId: string;
    fieldKey: string;
    label: string;
    fieldType: FieldType;
    placeholder?: string;
    helpText?: string;
    defaultValue?: string;
    isRequired: boolean;
    displayOrder: number;
    options?: FieldOption[];
    validationRules?: ValidationRules;
    conditionalLogic?: ConditionalLogic;
    createdAt: string;
    updatedAt: string;
};

export type CustomForm = {
    id: string;
    name: string;
    description?: string;
    targetEntity: "client" | "user" | "appointment";
    isActive: boolean;
    displayOrder: number;
    fields?: CustomFormField[];
    createdAt: string;
    updatedAt: string;
};

export type CustomFormResponse = {
    id: string;
    formId: string;
    entityId: string;
    entityType: string;
    responseData: Record<string, unknown>;
    submittedBy?: string;
    submittedAt: string;
    updatedAt: string;
};
