import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import WebsterLogo from "../../public/WebsterBeeLogo.png";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { PERMISSIONS } from "@/lib/permissions";
import { LogOut } from "lucide-react";

/**
 * A generic navigation layout component that can be used to create different types of navigation bars.
 */
interface NavigationLayoutProps {
    leftNavItems?: React.ReactNode,
    rightNavItems?:React.ReactNode,
}

/**
 * NavigationLayout Component
 * @param props - leftNavItems: ReactNode to be displayed on the left side of the navigation bar
 *                rightNavItems: ReactNode to be displayed on the right side of the navigation bar 
 * @returns 
 */
const NavigationLayout = ({
    leftNavItems,
    rightNavItems,
}: NavigationLayoutProps) => {

    return (
        <div className="flex items-center justify-beween p-[10px]">
            <div className="flex flex-row items-center gap-[10px] justify-start w-full">
                {leftNavItems}
            </div>
            <div className="flex flex-row items-center gap-[10px] justify-end w-full">
                {rightNavItems}
            </div>
        </div>
    )
}

// Props for logo customization
type LogoProps = {
    src?: string;
    fallbackText?: string;
}

// Props for LoginNav component
interface LoginNavProps {
    logo?: LogoProps;
    showCancelButton?: boolean;
}

/**
 * LoginNavigation Component
 * @param props - logo: LogoProps for customizing the logo (src and fallbackText)
 *                showCancelButton: boolean to conditionally show the Cancel button 
 * @returns 
 */
export const LoginNavigation = ({
    logo = { src: WebsterLogo, fallbackText: "RMS" },
    showCancelButton = false,
}: LoginNavProps) => {

    return (
        <NavigationLayout
            leftNavItems={
                <Avatar className="rounded-md">
                    <AvatarImage src={logo.src} />
                    <AvatarFallback>{logo.fallbackText}</AvatarFallback>
                </Avatar>
            }
            rightNavItems={showCancelButton && (
                <Link to="/sign-in">
                    <Button size="sm" variant="link">Cancel</Button>
                </Link>
            )}
        />
    )
}

// Props for MainNav component 
interface MainNavProps {
    logo?: LogoProps;
    navItems?: {
        text: string;
        link: string;
        permission?: string;
    }[];
}

/**
 * MainNavigation Component
 * @param props - logo: LogoProps for customizing the logo (src and fallbackText)
 *                navItems: Array of navigation items with text, link, and optional permission 
 * @returns 
 */
export const MainNavigation = ({
    logo = { src: WebsterLogo, fallbackText: "RMS" },
    // Can probably refactor this to pull from a config file or something
    navItems = [
        {
            text: "Dashboard",
            link: "/dashboard",
            permission: PERMISSIONS.VIEW_DASHBOARD,
        },
        {
            text: "Schedule",
            link: "/schedule",
            permission: PERMISSIONS.VIEW_SCHEDULE,
        },
        {
            text: "Notifications",
            link: "/notifications",
            permission: PERMISSIONS.VIEW_NOTIFICATIONS,
        },
        {
            text: "Client Management",
            link: "/clients",
            permission: PERMISSIONS.VIEW_CLIENTS,
        },
        {
            text: "User Management",
            link: "/users",
            permission: PERMISSIONS.VIEW_USERS,
        },
        {
            text: "Reports",
            link: "/reports",
            permission: PERMISSIONS.VIEW_REPORTS,
        },
        {
            text: "Settings",
            link: "/settings",
            permission: PERMISSIONS.VIEW_SETTINGS,
        },
        {
            text: "Help Center",
            link: "/help",
        },
    ]
}: MainNavProps) => {

    const navigate = useNavigate();
    /**
     * @TODO Add useUser() hook to get user information
     */

    return (
        <NavigationLayout
            // Able to pass in Fragments for more complex needs
            leftNavItems={
                <>
                    <Avatar className="rounded-md">
                        <AvatarImage src={logo.src} />
                        <AvatarFallback>{logo.fallbackText}</AvatarFallback>
                    </Avatar>
                    {navItems.map((button, idx) => (
                        /**
                         * @TODO Add permission check here
                         */
                        <Link key={button.link ?? idx} to={button.link}>
                            <Button size="sm" className="active:bg-primary/90">{button.text}</Button>
                        </Link>
                    ))}
                    
                </>
                
            }
            rightNavItems={
                <Button 
                    size="sm"
                    onClick={() => {
                        /**
                         * @TODO Add logout functionality here
                         */

                        navigate({to: "/login"});
                    }}
                >
                    {/**
                     * @TODO Replace with dynamic user name from user context 
                     * */}
                    Example User 
                    <LogOut />
                </Button>
            }
        />
    )
}

export const SecondaryNavigation = () => {

    /**
     * @TODO Add secondary navigation implementation here
     */
}
