import { Button } from "@/components/ui/button";
import { useSupportContact } from "@/hooks/useAuth";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_login/request-admin-help")({
    component: RouteComponent,
});

function RouteComponent() {
    const { data, isLoading, isError } = useSupportContact();

    console.log("Support contact data:", data);

    return (
        <>
            <h1 className="mb-6 text-center text-xl font-semibold">Contact Support</h1>

            {isLoading && (
                <p className="text-center text-gray-600">Loading contact information...</p>
            )}

            {isError && (
                <div className="rounded-md bg-red-50 p-4 mb-4">
                    <p className="text-sm text-red-800">
                        Unable to load support contact information. Please try again later.
                    </p>
                </div>
            )}

            {data && (
                <div className="space-y-4">
                    <p className="text-center text-gray-600">
                        Need help accessing your account? Contact your organization administrator.
                    </p>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
                        <p className="text-xl font-bold mb-1">{data.contactName}</p>
                        {data.phone ? (
                            <>
                                <p className="text-lg font-semibold mb-2">{data.phone}</p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-600">
                                No phone number available. Please contact your organization
                                directly.
                            </p>
                        )}
                    </div>
                </div>
            )}

            <Link to="/{-$subdomain}/sign-in">
                <Button variant="link" className="w-full mt-4">
                    ← Back to Sign In
                </Button>
            </Link>
        </>
    );
}
