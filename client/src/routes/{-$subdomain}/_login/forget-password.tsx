import RequestPasswordResetForm from "@/components/form/RequestPasswordResetForm";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$subdomain}/_login/forget-password")({
    component: RouteComponent,
});

function RouteComponent() {

    return (
        <>
            <h1 className="mb-6 text-center text-xl font-semibold">Request Password Reset</h1>
            <RequestPasswordResetForm />
            <Link to="/{-$subdomain}/request-admin-help">
                <Button variant="link" className="w-full mt-3">
                    Request Admin Help
                </Button>
            </Link>
        </>
    )
}
