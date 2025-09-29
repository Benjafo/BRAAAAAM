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

interface NavItemComponents {
    [key: string]: React.ReactNode;
}

const navComponents: NavItemComponents = {
    datePicker: <Calendar28 />,
    dayWeekMonthTabs:
        <Tabs defaultValue="week">
            <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
        </Tabs>,
    calendarViewTabs:
        <Tabs defaultValue="calendar">
            <TabsList>
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
        </Tabs>,
    adminSettingsTabs:
        <Tabs defaultValue="general">
            <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="forms">Forms</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="auditLog">Audit Log</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
            </TabsList>
        </Tabs>,
    previousButton: <Button size="sm" variant="secondary" className="active:bg-primary/90">Previous</Button>,
    nextButton: <Button size="sm" variant="secondary" className="active:bg-primary/90">Next</Button>,
    filtersButton: <Button size="sm" variant="secondary" className="active:bg-primary/90">Filters</Button>,
    exportButton: <Button size="sm" variant="secondary" className="active:bg-primary/90">Export</Button>,
    printButton: <Button size="sm" variant="secondary" className="active:bg-primary/90">Print</Button>,
    cancelButton: <Button size="sm" variant="secondary" className="active:bg-primary/90">Cancel</Button>,
    columnSelector: null, // todo: import combobox
    reportTypeSelector: null,
    reportFormatSelector: null,
    searchBar: null, // todo: make a search field
    newOrganizationPButton: <Button size="sm" className="active:bg-primary/90">New Organization</Button>,
    newRidePButton: <Button size="sm" className="active:bg-primary/90">New Ride</Button>,
    cancelRidePButton: <Button size="sm" className="active:bg-primary/90">Cancel Ride</Button>,
    unavailabilityPButton: <Button size="sm" className="active:bg-primary/90">Schedule Unavailability</Button>,
    newClientPButton: <Button size="sm" className="active:bg-primary/90">New Client</Button>,
    newUserPButton: <Button size="sm" className="active:bg-primary/90">New User</Button>,
    editPagePButton: <Button size="sm" className="active:bg-primary/90">Edit Page</Button>,
    saveChangesPButton: <Button size="sm" className="active:bg-primary/90">Save Changes</Button>,
    newRolePButton: <Button size="sm" className="active:bg-primary/90">New Role</Button>,
    saveRolePButton: <Button size="sm" className="active:bg-primary/90">Save Role</Button>,
    exportPButton: <Button size="sm" className="active:bg-primary/90">Export</Button>,
    newAliasPButton: <Button size="sm" className="active:bg-primary/90">New Alias</Button>
}

export const secondaryNavConfigs = {
    "/organizations": {
        "superadmin": {
            leftNavItems: [navComponents.search, navComponents.filtersButton, navComponents.exportButton],
            rightNavItems: [navComponents.newOrganizationPButton]
        }
    },
    "/schedule-calendarview": {
        "driver": {
            leftNavItems: [navComponents.datePicker, navComponents.calendarViewTabs, navComponents.dayWeekMonthTabs, navComponents.filtersButton, navComponents.printButton],
            rightNavItems: [navComponents.previousButton, navComponents.nextButton, navComponents.cancelRidePButton]
        },
        "dispatcher": {
            leftNavItems: [navComponents.datePicker, navComponents.calendarViewTabs, navComponents.dayWeekMonthTabs, navComponents.filtersButton, navComponents.printButton],
            rightNavItems: [navComponents.previousButton, navComponents.nextButton, navComponents.newRidePButton]
        }
    },
    "/schedule-listview": {
        "driver": {
            leftNavItems: [navComponents.datePicker, navComponents.calendarViewTabs, navComponents.filtersButton, navComponents.printButton],
            rightNavItems: [navComponents.previousButton, navComponents.nextButton, navComponents.cancelRidePButton]
        }
    },
    "/unassigned-calendarview": {
        "driver": {
            leftNavItems: [navComponents.datePicker, navComponents.calendarViewTabs, navComponents.dayWeekMonthTabs, navComponents.filtersButton, navComponents.printButton],
            rightNavItems: [navComponents.previousButton, navComponents.nextButton]
        }
    },
    "/unassigned-listview": {
        "driver": {
            leftNavItems: [navComponents.datePicker, navComponents.calendarViewTabs, navComponents.filtersButton, navComponents.printButton],
            rightNavItems: [navComponents.previousButton, navComponents.nextButton]
        }
    },
    "/notifications": {
        "driver": {
            leftNavItems: [navComponents.datePicker, navComponents.filtersButton, navComponents.printButton],
            rightNavItems: [navComponents.previousButton, navComponents.nextButton, navComponents.cancelRidePButton]
        }
    },
    "/availability": {
        "driver": {
            leftNavItems: [navComponents.datePicker, navComponents.calendarViewTabs, navComponents.dayWeekMonthTabs, navComponents.filtersButton, navComponents.printButton],
            rightNavItems: [navComponents.previousButton, navComponents.nextButton, navComponents.unavailabilityPButton]
        }
    },
    "/clients": {
        "dispatcher": {
            leftNavItems: [navComponents.search, navComponents.filtersButton, navComponents.columnSelector, navComponents.exportButton],
            rightNavItems: [navComponents.newClientPButton]
        }
    },
    "/users": {
        "dispatcher": {
            leftNavItems: [navComponents.search, navComponents.filtersButton, navComponents.columnSelector, navComponents.exportButton],
            rightNavItems: [navComponents.newUserPButton]
        },
        "admin": {
            leftNavItems: [navComponents.search, navComponents.filtersButton, navComponents.columnSelector, navComponents.exportButton],
            rightNavItems: [navComponents.newUserPButton]
        }
    },
    "/reports": {
        "admin": {
            leftNavItems: [navComponents.datePicker, navComponents.reportTypeSelector, navComponents.reportFormatSelector, navComponents.filtersButton],
            rightNavItems: [navComponents.exportPButton]
        }
    },
    "/org-settings-general": {
        "admin": {
            leftNavItems: [navComponents.adminSettingsTabs],
            rightNavItems: [navComponents.saveChangesPButton]
        }
    },
    "/org-settings-forms": {
        "admin": {
            leftNavItems: [navComponents.adminSettingsTabs],
            rightNavItems: [navComponents.saveChangesPButton]
        }
    },
    "/org-settings-roles": {
        "admin": {
            leftNavItems: [navComponents.searchBar, navComponents.adminSettingsTabs],
            rightNavItems: [navComponents.newRolePButton]
        }
    },
    "/org-settings-editrole": {
        "admin": {
            leftNavItems: [navComponents.searchBar, navComponents.adminSettingsTabs],
            rightNavItems: [navComponents.saveRolePButton]
        }
    },
    "/org-settings-auditlog": {
        "admin": {
            leftNavItems: [navComponents.searchBar, navComponents.adminSettingsTabs, navComponents.filtersButton],
            rightNavItems: [navComponents.exportPButton]
        }
    },
    "/org-settings-locations": {
        "admin": {
            leftNavItems: [navComponents.searchBar, navComponents.adminSettingsTabs],
            rightNavItems: [navComponents.newAliasPButton]
        }
    }
}

export const SecondaryNavigation = () => {
    const testRoute = "/organizations";
    const testRole = "superadmin";
    return <NavigationLayout
        leftNavItems={
            secondaryNavConfigs[testRoute][testRole].leftNavItems.map((Component) => (Component))
        }
        rightNavItems={
            secondaryNavConfigs[testRoute][testRole].rightNavItems.map((Component) => (Component))
        }
    />
}
