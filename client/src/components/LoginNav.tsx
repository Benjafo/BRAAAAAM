import WebsterLogo from "../../public/WebsterBeeLogo.png";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "./ui/button";

export function LoginNav() {
    const routerState = useRouterState();
    const pathname = routerState.location.pathname;

    // Show button only on reset-password page
    const showButton = pathname === "/reset-password"; // only on this page
    const buttonText = "Login";
    const buttonLink = "/sign-in";

    return (
        <div className="w-full bg-gray-100 pt-5 px-5 pb-2 flex items-center justify-start h-16">
            <img src={WebsterLogo} alt="Logo" className="h-8 w-8 rounded-md" />
            {showButton && (
                <Link to={buttonLink} className="ml-auto">
                    <Button className="cursor-pointer">{buttonText}</Button>
                </Link>
            )}
        </div>
    );
}
