import { LoginNav } from "@/components/LoginNav";
import { createFileRoute, Outlet } from "@tanstack/react-router";

const loginRoute = () => (
    <>
        <LoginNav />
        <Outlet />
    </>
);

export const Route = createFileRoute("/_login")({
    component: loginRoute,
});
