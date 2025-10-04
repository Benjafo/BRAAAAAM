import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";

export function UserProfile() {
    const { user, signOut, isLoading } = useAuth();

    if (!user) return null;

    return (
        <div className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex-1">
                <div className="font-medium">
                    {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="text-xs text-blue-600">Role: {user.role}</div>
            </div>

            <Button variant="outline" size="sm" onClick={() => signOut()} disabled={isLoading}>
                {isLoading ? "Signing out..." : "Sign Out"}
            </Button>
        </div>
    );
}
