import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import WebsterLogo from "../../public/WebsterBeeLogo.png";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { PERMISSIONS } from "@/lib/permissions";
import { LogOut } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"

/**
 * A generic navigation layout component that can be used to create different types of navigation bars.
 */
interface NavigationLayoutProps {
    leftNavItems?: React.ReactNode,
    rightNavItems?: React.ReactNode,
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
        <div className="flex items-center justify-between p-[10px]">
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

                        navigate({ to: "/sign-in" });
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

// Copied from ShadCN's date picker example page; modified to remove label and wrapper <div>.
import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
function formatDate(date: Date | undefined) {
    if (!date) {
        return ""
    }
    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
}
function isValidDate(date: Date | undefined) {
    if (!date) {
        return false
    }
    return !isNaN(date.getTime())
}
export function Calendar28() {
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(
        new Date("2025-06-01")
    )
    const [month, setMonth] = React.useState<Date | undefined>(date)
    const [value, setValue] = React.useState(formatDate(date))
    return (
        <div className="relative flex gap-2">
            <Input
                id="date"
                value={value}
                placeholder="June 01, 2025"
                className="bg-background pr-10 min-w-[150px]"
                onChange={(e) => {
                    const date = new Date(e.target.value)
                    setValue(e.target.value)
                    if (isValidDate(date)) {
                        setDate(date)
                        setMonth(date)
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                        e.preventDefault()
                        setOpen(true)
                    }
                }}
            />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date-picker"
                        variant="ghost"
                        className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                    >
                        <CalendarIcon className="size-3.5" />
                        <span className="sr-only">Select date</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="end"
                    alignOffset={-8}
                    sideOffset={10}
                >
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        month={month}
                        onMonthChange={setMonth}
                        onSelect={(date) => {
                            setDate(date)
                            setValue(formatDate(date))
                            setOpen(false)
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
// End of copied code from ShadCN.

export const SecondaryNavigation = () => {
    return <NavigationLayout
        leftNavItems={<>
            <Calendar28 /><Tabs defaultValue="optionTwo">
                <TabsList>
                    <TabsTrigger value="optionOne">List View</TabsTrigger>
                    <TabsTrigger value="optionTwo">Calendar View</TabsTrigger>
                </TabsList>
            </Tabs><Tabs defaultValue="optionTwo">
                <TabsList>
                    <TabsTrigger value="optionOne">Day</TabsTrigger>
                    <TabsTrigger value="optionTwo">Week</TabsTrigger>
                    <TabsTrigger value="optionThree">Month</TabsTrigger>
                </TabsList>
            </Tabs>
            <Button size="sm" variant="secondary" className="active:bg-primary/90">Filters</Button>
            <Button size="sm" variant="secondary" className="active:bg-primary/90">Print</Button>
        </>
        }
        rightNavItems={
            <>
                <Button size="sm" variant="secondary" className="active:bg-primary/90">Previous</Button>
                <Button size="sm" variant="secondary" className="active:bg-primary/90">Next</Button>
                <Button size="sm" className="active:bg-primary/90">New Ride</Button>
            </>
        }
    />
}
