import RequestPasswordResetForm from "@/components/form/RequestPasswordResetForm";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_login/forget-password")({
    component: RouteComponent,
});

function RouteComponent() {

    return (
        <>
            <h1 className="mb-6 text-center text-xl font-semibold">Request Password Reset</h1>
            <RequestPasswordResetForm />
            {/** 
             * @TODO 
             * Add "Request Admin Help" link that goes to a page with instructions 
             * to contact the system administrator for help resetting the password.
            */}
            <Link to={"/"}>
                <Button variant="link" className="w-full mt-3">
                    Request Admin Help
                </Button>
            </Link>
        </>
    )
}
