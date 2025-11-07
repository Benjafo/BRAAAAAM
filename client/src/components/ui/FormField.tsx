import React from "react";
import { Input } from "./input";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FormFieldProps {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    autoComplete?: string;
    error?: FieldError;
    register: UseFormRegisterReturn;
}

const FormField: React.FC<FormFieldProps> = ({
    id,
    label,
    type = "text",
    placeholder,
    autoComplete,
    error,
    register,
}) => (
    <div className="mb-4">
        <label
            htmlFor={id}
            className="mb-1 block text-sm font-medium text-muted-foreground text-left w-full"
        >
            {label}
        </label>
        <Input
            id={id}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className="text-sm"
            {...register}
        />
        {error && <p className="text-destructive text-sm mt-1">{error.message}</p>}
    </div>
);

export default FormField;
