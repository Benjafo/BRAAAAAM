import { useLogout } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/lib/permissions";
import { Link, useNavigate, type ToOptions } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import WebsterLogo from "../../public/WebsterBeeLogo.png";
import { useAuthStore } from "./stores/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

/**
 * A generic navigation layout component that can be used to create different types of navigation bars.
 */
interface NavigationLayoutProps {
    leftNavItems?: React.ReactNode;
    rightNavItems?: React.ReactNode;
}

/**
 * NavigationLayout Component
 * @param props - leftNavItems: ReactNode to be displayed on the left side of the navigation bar
 *                rightNavItems: ReactNode to be displayed on the right side of the navigation bar
 * @returns
 */
const NavigationLayout = ({ leftNavItems, rightNavItems }: NavigationLayoutProps) => {
    return (
        <div className="flex items-center justify-beween p-[10px]">
            <div className="flex flex-row items-center gap-[10px] justify-start w-full">
                {leftNavItems}
            </div>
            <div className="flex flex-row items-center gap-[10px] justify-end w-full">
                {rightNavItems}
            </div>
        </div>
    );
};

// Props for logo customization
type LogoProps = {
    src?: string;
    fallbackText?: string;
};

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
            rightNavItems={
                showCancelButton && (
                    <Link to="/{-$subdomain}/sign-in">
                        <Button size="sm" variant="link">
                            Cancel
                        </Button>
                    </Link>
                )
            }
        />
    );
};

// Props for MainNav component
interface MainNavProps {
    logo?: LogoProps;
    navItems?: {
        text: string;
        link: ToOptions["to"];
        permission?: string | string[];
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
            text: "Organizations",
            link: "/{-$subdomain}/organizations",
            permission: PERMISSIONS.ORGANIZATIONS_READ,
        },
        {
            text: "Dashboard",
            link: "/{-$subdomain}/dashboard",
            permission: PERMISSIONS.DASHBOARD_READ,
        },
        {
            text: "Schedule",
            link: "/{-$subdomain}/schedule",
            permission: PERMISSIONS.APPOINTMENTS_READ,
        },
        {
            text: "Unassigned Rides",
            link: "/{-$subdomain}/unassigned-rides",
            permission: PERMISSIONS.APPOINTMENTS_READ,
        },
        {
            text: "Unavailability",
            link: "/{-$subdomain}/unavailability",
            permission: [PERMISSIONS.OWN_UNAVAILABILITY_READ, PERMISSIONS.ALL_UNAVAILABILITY_READ],
        },
        // {
        //     text: "Notifications",
        //     link: "/notifications",
        //     permission: PERMISSIONS.VIEW_NOTIFICATIONS,
        // },
        {
            text: "Client Management",
            link: "/{-$subdomain}/clients",
            permission: PERMISSIONS.CLIENTS_READ,
        },
        {
            text: "User Management",
            link: "/{-$subdomain}/users",
            permission: PERMISSIONS.USERS_READ,
        },
        {
            text: "Volunteer Reporting",
            link: "/{-$subdomain}/volunteer-records",
            permission: [PERMISSIONS.OWN_VOLUNTEER_RECORDS_READ, PERMISSIONS.ALL_VOLUNTEER_RECORDS_READ],
        },
        {
            text: "Reports",
            link: "/{-$subdomain}/reports",
            permission: PERMISSIONS.REPORTS_EXPORT,
        },
        {
            text: "Settings",
            link: "/{-$subdomain}/admin-settings",
            permission: PERMISSIONS.SETTINGS_READ,
        },
        // {
        //     text: "Help Center",
        //     link: "/help",
        // },
    ],
}: MainNavProps) => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const hasPermission = useAuthStore((s) => s.hasPermission);
    const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
    const logout = useLogout();

    const visibleNavItems = navItems.filter((item) => {
        // Show the item if no permission required
        if (!item.permission) return true;
        // Check if user has any of the required permissions
        if (Array.isArray(item.permission)) {
            return hasAnyPermission(item.permission);
        }
        // Handle single permission
        return hasPermission(item.permission);
    });

    const handleSignOut = async () => {
        logout.mutate(undefined, {
            onSettled: () => {
                navigate({ to: "/{-$subdomain}/sign-in" });
            },
        });
    };

    return (
        <NavigationLayout
            // Able to pass in Fragments for more complex needs
            leftNavItems={
                <>
                    <Avatar className="rounded-md">
                        <AvatarImage src={logo.src} />
                        <AvatarFallback>{logo.fallbackText}</AvatarFallback>
                    </Avatar>
                    {visibleNavItems.map((button, idx) => (
                        <Link key={button.link ?? idx} to={button.link}>
                            <Button
                                size="sm"
                                variant={"secondary"}
                                className="active:bg-secondary/70"
                            >
                                {button.text}
                            </Button>
                        </Link>
                    ))}
                </>
            }
            rightNavItems={
                <Button size="sm" variant={"secondary"} onClick={handleSignOut}>
                    {user ? `${user.firstName} ${user.lastName}` : "User"}
                    <LogOut />
                </Button>
            }
        />
    );
};

export const SecondaryNavigation = () => {
    /**
     * @TODO Add secondary navigation implementation here
     */
};
