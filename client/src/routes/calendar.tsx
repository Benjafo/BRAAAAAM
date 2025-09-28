import { createFileRoute } from '@tanstack/react-router'
import ReactBigCalendar from '../calendar'

export const Route = createFileRoute('/calendar')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ReactBigCalendar />
}
