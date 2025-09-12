import { createFileRoute } from "@tanstack/react-router";
import { SignInPage } from "@/components/SignInPage";

export const Route = createFileRoute("/_login/sign-in")({
    component: SignInComponent,
});

function SignInComponent() {
    return <SignInPage />;
}
