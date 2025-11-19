import { useLogout } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/lib/permissions";
import { Link, useNavigate, useRouterState, type ToOptions } from "@tanstack/react-router";
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
        <div className="flex items-center justify-between p-[10px]">
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
            // Add the org name somewhere (top right? Top left?) - Replace with {$orgName} Dashboard
            link: "/{-$subdomain}/dashboard",
            permission: PERMISSIONS.DASHBOARD_READ,
        },
        {
            text: "Schedule",
            link: "/{-$subdomain}/schedule",
            permission: [PERMISSIONS.OWN_APPOINTMENTS_READ, PERMISSIONS.ALL_APPOINTMENTS_READ],
        },
        {
            text: "Unassigned Rides",
            link: "/{-$subdomain}/unassigned-rides",
            permission: [PERMISSIONS.OWN_APPOINTMENTS_READ, PERMISSIONS.ALL_APPOINTMENTS_READ],
        },
        {
            text: "Unavailability",
            link: "/{-$subdomain}/unavailability",
            permission: [PERMISSIONS.OWN_UNAVAILABILITY_READ, PERMISSIONS.ALL_UNAVAILABILITY_READ],
        },
        {
            text: "Notifications",
            link: "/{-$subdomain}/notifications",
            permission: [PERMISSIONS.OWN_NOTIFICATIONS_READ, PERMISSIONS.ALL_NOTIFICATIONS_READ],
        },
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
            text: "Call Logs",
            link: "/{-$subdomain}/call-logs",
            permission: PERMISSIONS.CALL_LOGS_READ,
        },
        {
            text: "Volunteer Reporting",
            link: "/{-$subdomain}/volunteer-records",
            permission: [
                PERMISSIONS.OWN_VOLUNTEER_RECORDS_READ,
                PERMISSIONS.ALL_VOLUNTEER_RECORDS_READ,
            ],
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
            // {
            //     text: "Help Center",
            //     link: "/help",
            // },
        },
    ],
}: MainNavProps) => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const hasPermission = useAuthStore((s) => s.hasPermission);
    const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
    const subdomain = useAuthStore((s) => s.subdomain);
    const logout = useLogout();

    // Get current route to highlight active tab
    const routerState = useRouterState();
    const currentPath = routerState.location.pathname;

    // org-name, org_name -> Org Name
    const orgName = subdomain
        ? subdomain
              // Convert hyphen or underscore to space -> org_name, org-name -> "org name"
              .replace(/[-_]/g, " ")
              // Convert camelCase to split -> orgName -> "org name"
              .replace(/([a-z])([A-Z])/g, "$1 $2")
              // Normalize spaces
              .replace(/\s+/g, " ")
              .trim()
              // Title Case everything
              .toLowerCase()
              .replace(/\b\w/g, (c) => c.toUpperCase())
        : null;

    const navItemsWithOrgName = navItems.map((item) => {
        if (item.text === "Dashboard" && orgName) {
            return { ...item, text: `${orgName} Dashboard` };
        }
        return item;
    });

    const visibleNavItems = navItemsWithOrgName.filter((item) => {
        // Show the item if no permission required
        if (!item.permission) return true;
        // Check if user has any of the required permissions
        if (Array.isArray(item.permission)) {
            return hasAnyPermission(item.permission);
        }
        // Handle single permission
        return hasPermission(item.permission);
    });

    const computedNavItems = visibleNavItems.map((item) => {
        if (item.text === "Dashboard" && orgName) {
            return { ...item, text: `${orgName} Dashboard` };
        }
        return item;
    });

    // Helper function to check if a nav item is active (AI help on this)
    const isActiveRoute = (link: ToOptions["to"]): boolean => {
        // Convert link to string for comparison
        const linkStr = typeof link === "string" ? link : String(link);

        const linkPath = subdomain ? linkStr.replace("{-$subdomain}", subdomain) : linkStr;

        // Check if current path starts with the link path
        return currentPath.startsWith(linkPath);
    };

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
                    {/* AI help on this */}
                    {computedNavItems.map((button, idx) => {
                        const isActive = isActiveRoute(button.link);
                        return (
                            <Link key={button.link ?? idx} to={button.link}>
                                <Button
                                    size="sm"
                                    variant={isActive ? "default" : "secondary"}
                                    className={isActive ? "" : "active:bg-secondary/70"}
                                >
                                    {button.text}
                                </Button>
                            </Link>
                        );
                    })}
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
