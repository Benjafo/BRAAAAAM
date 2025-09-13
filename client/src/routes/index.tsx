import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">New Ride</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Welcome to the BRAAAAAM ride management system. This is the New Ride page.</p>
        <p className="text-gray-600 mt-4">Use the sidebar to navigate to different sections of the application.</p>
      </div>
    </div>
  )
}
