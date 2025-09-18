import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { initialize } = useAuth();

    useEffect(() => {
        initialize();
    }, [initialize]);

    return <>{children}</>;
}
