import { NavigationMenu } from "@/components/ui/navigation-menu";
import { NavigationMenuItem } from "@/components/ui/navigation-menu";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { NavigationMenuList } from "@/components/ui/navigation-menu";

const NAV_OPTIONS = {
  "Dashboard": "#",
  "Schedule": "#",
  "Notifications": "#",
  "Client Management": "#",
  "User Management": "#",
  "Reports": "#",
  "Settings": "#",
  "Help Center": "#",
};

export default function NavBar() {
  return (
    <header className="w-full border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex h-[60px] max-w-screen-2xl items-center px-3">
        <NavigationMenu>
          <NavigationMenuList className="flex items-center gap-[10px]">
            <NavigationMenuItem>
              <div
                aria-label="Home"
                className="flex h-[32px] w-[32px] items-center justify-center rounded-[4px] overflow-hidden bg-[#5499c7]"
              >
                <img
                  src="../../public/wasps_logo_original.svg"
                  alt="Webster Association of Senior Program Supporters logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </NavigationMenuItem>


            {Object.entries(NAV_OPTIONS).map(([label, href]) => (
              <NavigationMenuItem key={label}>
                <NavigationMenuLink
                  href={href}
                  aria-label={label}
                  className="
                    inline-flex items-center justify-center
                    h-[32px] px-[12px]
                    rounded-[8px]
                    text-sm font-medium leading-none
                    text-white
                    bg-neutral-800
                    hover:bg-neutral-700
                    visited:text-white active:bg-neutral-700
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500
                    data-[state=open]:bg-neutral-700 data-[active]:bg-neutral-700
                  "
                >
                  {label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
