import SignInForm from "@/components/form/SignInForm";
import NewClientModal from "@/components/modals/newClientModal";
import NewDriverModal from "@/components/modals/newDriverModal";
import NewLocationModal from "@/components/modals/newLocationModal";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_login/sign-in")({
    component: RouteComponent,
});

/**
 * Show SignInForm with "Forgot Password" link
 * @returns JSX.Element
 */
function RouteComponent() {
    return (
        <>
            <h1 className="mb-6 text-center text-xl font-semibold">Sign in</h1>
            <NewClientModal />
            <NewDriverModal />
            <NewLocationModal />
            <SignInForm />
            <Link to={"/forget-password"}>
                <Button variant="link" className="w-full mt-3">
                    Forgot Password
                </Button>
            </Link>
        </>
    );
}
