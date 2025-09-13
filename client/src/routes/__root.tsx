
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { NavigationMenuDemo } from '../components/navigatebar'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const RootLayout = () => (
    <>
        <div id="allBar">
            <div id="leftBar">
                <Avatar>
                    <AvatarImage src="https://food.fnr.sndimg.com/content/dam/images/food/editorial/talent/rachael-ray/FN-TalentAvatar-Rachael-Ray-colorblock.jpg.rend.hgtvcom.126.126.suffix/1531174952566.webp" />
                    <AvatarFallback>XY</AvatarFallback>
                </Avatar>
                <NavigationMenuDemo />
            </div>
            <Button variant="outline">Log Out</Button>
        </div>
        <Outlet />
        <TanStackRouterDevtools />
    </>
)

document.getElementById("leftBar")?.setAttribute("style", "display: flex; gap: 10px")
document.getElementById("allBar")?.setAttribute("style", "display: flex; justify-content: space-between")
export const Route = createRootRoute({ component: RootLayout })