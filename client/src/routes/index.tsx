import { createFileRoute } from '@tanstack/react-router'
import CalendarPage from '../calendar'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <CalendarPage />
}
