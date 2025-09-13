import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { ExitIcon } from "@radix-ui/react-icons";

const MenuItemButton = ({ text }: { text: string }) => {
    return (
        <Button
            variant="ghost"
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md px-3 py-1.5 h-auto font-normal"
        >
            {text}
        </Button>
    );
};

export function NavigationMenuDemo() {
    return (
        <div className="w-full bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                    {/* Logo */}
                    <Avatar className="h-8 w-8 rounded-md">
                        <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
                        <AvatarFallback className="rounded-md bg-red-600 text-white">
                            ER
                        </AvatarFallback>
                    </Avatar>
                    {/* Navigation Items */}
                    <NavigationMenu>
                        <NavigationMenuList className="flex gap-1">
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <MenuItemButton text="Organizations" />
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <MenuItemButton text="Notifications" />
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <MenuItemButton text="Settings" />
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <MenuItemButton text="Help Center" />
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                {/* Logout */}
                <Button className="bg-gray-900 text-white hover:bg-gray-800 rounded-md px-3 py-1.5 h-auto font-normal flex items-center gap-2">
                    Ben Foley
                    <ExitIcon />
                </Button>
            </div>
        </div>
    );
}
