import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$subdomain}')({
    component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
