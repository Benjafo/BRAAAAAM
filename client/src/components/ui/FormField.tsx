import React from "react";
import { Input } from "./input";

interface FormFieldProps {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    errors?: Record<string, string>;
}

const FormField: React.FC<FormFieldProps & Record<string, unknown>> = ({
    id,
    label,
    type = "text",
    placeholder,
    errors = {}, // Default to empty object
    ...props
}) => (
    <div className="mb-4">
        {/* Label properly associated with input for accessibility */}
        <label
            htmlFor={id}
            className="mb-1 block text-sm font-medium text-gray-700 text-left w-full"
        >
            {label}
        </label>
        {/* Input field with consistent styling and required attribute */}
        <Input
            id={id}
            name={id} // Name attribute for FormData extraction
            type={type}
            placeholder={placeholder}
            className="text-sm"
            required // Basic browser validation fallback
            {...props} // Spread additional props like autoComplete
        />
        {/* Conditional error message display with margin top for spacing */}
        {errors[id] && <p className="text-red-500 text-sm mt-1">{errors[id]}</p>}
    </div>
);

export default FormField;
