import { createFileRoute, Link } from "@tanstack/react-router";
import SignInForm from "@/components/form/SignInForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/{-$subdomain}/_login/sign-in")({
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
            <SignInForm />
            <Link to={"/{-$subdomain}/forget-password"}>
                <Button variant="link" className="w-full mt-3">
                    Forgot Password
                </Button>
            </Link>
        </>
    )

}
