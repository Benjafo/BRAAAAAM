import express, { Router } from "express";

const router: Router = express.Router();

type User = {
    name: string
    phoneNumber: string
    email: string
    address: string
    city: string
    zip: number
    role: 'driver' | 'dispatcher' | 'admin'
}

type Client = {
    name: string
    phoneNumber: string
    address: string
    city: string
    zip: number
    status: 'active' | 'inactive'
}

const USERS: User[] = [
    { name: 'Smith, John', phoneNumber: '(555) 123-4567', email: 'john.smith@example.com', address: "105 Stark Street", city: "Rochester", zip: 14623, role: 'driver' },
    { name: 'Johnson, Sarah', email: 'sarah.j@example.com', phoneNumber: '(555) 234-5678', address: '200 Main St', city: 'Rochester', zip: 14604, role: 'dispatcher' },
    { name: 'Brown, Michael', email: 'mbrown@example.com', phoneNumber: '(555) 345-6789', address: '300 Oak Ave', city: 'Rochester', zip: 14605, role: 'admin' },
    { name: 'Davis, Emily', email: 'emily.davis@example.com', phoneNumber: '(555) 456-7890', address: '400 Pine Rd', city: 'Rochester', zip: 14606, role: 'driver' },
    { name: 'Wilson, James', email: 'j.wilson@example.com', phoneNumber: '(555) 567-8901', address: '500 Elm St', city: 'Rochester', zip: 14607, role: 'driver' },
    { name: 'Martinez, Lisa', email: 'lisa.m@example.com', phoneNumber: '(555) 678-9012', address: '600 Maple Dr', city: 'Rochester', zip: 14608, role: 'dispatcher' },
    { name: 'Taylor, Robert', email: 'rtaylor@example.com', phoneNumber: '(555) 789-0123', address: '700 Cedar Ln', city: 'Rochester', zip: 14609, role: 'admin' },
    { name: 'Anderson, Jennifer', email: 'jennifer.a@example.com', phoneNumber: '(555) 890-1234', address: '800 Birch Way', city: 'Rochester', zip: 14610, role: 'driver' },
    { name: 'Thomas, William', email: 'w.thomas@example.com', phoneNumber: '(555) 901-2345', address: '900 Spruce Ct', city: 'Rochester', zip: 14611, role: 'dispatcher' },
    { name: 'Garcia, Maria', email: 'maria.garcia@example.com', phoneNumber: '(555) 012-3456', address: '1000 Walnut Pl', city: 'Rochester', zip: 14612, role: 'driver' },
    { name: 'Lee, David', email: 'david.lee@example.com', phoneNumber: '(555) 123-4568', address: '1100 Ash Blvd', city: 'Rochester', zip: 14613, role: 'admin' },
    { name: 'White, Jessica', email: 'jwhite@example.com', phoneNumber: '(555) 234-5679', address: '1200 Poplar Ave', city: 'Rochester', zip: 14614, role: 'driver' },
]

const CLIENTS: Client[] = [
    { name: 'Harris, Christopher', phoneNumber: '(585) 555-1000', address: '100 Corporate Dr', city: 'Rochester', zip: 14623, status: 'active' },
    { name: 'Moore, Amanda', phoneNumber: '(585) 555-1001', address: '250 Innovation Way', city: 'Rochester', zip: 14604, status: 'active' },
    { name: 'Clark, Daniel', phoneNumber: '(585) 555-1002', address: '500 Commerce St', city: 'Victor', zip: 14564, status: 'active' },
    { name: 'Lewis, Michelle', phoneNumber: '(585) 555-1003', address: '750 Health Plaza', city: 'Rochester', zip: 14620, status: 'active' },
    { name: 'Walker, Brandon', phoneNumber: '(585) 555-1004', address: '1200 River Rd', city: 'Greece', zip: 14626, status: 'inactive' },
    { name: 'Hall, Nicole', phoneNumber: '(585) 555-1005', address: '300 Builder Ave', city: 'Rochester', zip: 14612, status: 'active' },
    { name: 'Allen, Gregory', phoneNumber: '(585) 555-1006', address: '45 Main St', city: 'Pittsford', zip: 14534, status: 'active' },
    { name: 'Young, Stephanie', phoneNumber: '(585) 555-1007', address: '600 Tech Park', city: 'Henrietta', zip: 14467, status: 'active' },
    { name: 'King, Raymond', phoneNumber: '(585) 555-1008', address: '2500 County Line Rd', city: 'Rush', zip: 14543, status: 'active' },
    { name: 'Wright, Patricia', phoneNumber: '(585) 555-1009', address: '800 Executive Blvd', city: 'Rochester', zip: 14623, status: 'inactive' },
    { name: 'Scott, Kevin', phoneNumber: '(585) 555-1010', address: '150 Industrial Pkwy', city: 'Brockport', zip: 14420, status: 'active' },
    { name: 'Green, Rebecca', phoneNumber: '(585) 555-1011', address: '1000 Lakeshore Dr', city: 'Webster', zip: 14580, status: 'active' },
    { name: 'Baker, Timothy', phoneNumber: '(585) 555-1012', address: '425 Creative Ln', city: 'Rochester', zip: 14607, status: 'active' },
    { name: 'Adams, Samantha', phoneNumber: '(585) 555-1013', address: '3000 Factory St', city: 'Rochester', zip: 14611, status: 'inactive' },
    { name: 'Nelson, Richard', phoneNumber: '(585) 555-1014', address: '200 Wellness Way', city: 'Penfield', zip: 14526, status: 'active' },
    { name: 'Carter, Elizabeth', phoneNumber: '(585) 555-1015', address: '900 Downtown Plaza', city: 'Rochester', zip: 14604, status: 'active' },
    { name: 'Mitchell, Andrew', phoneNumber: '(585) 555-1016', address: '1500 Delivery Dr', city: 'Gates', zip: 14624, status: 'active' },
    { name: 'Perez, Katherine', phoneNumber: '(585) 555-1017', address: '550 Finance Blvd', city: 'Rochester', zip: 14620, status: 'active' },
    { name: 'Roberts, Jeffrey', phoneNumber: '(585) 555-1018', address: '2200 Construction Ave', city: 'Fairport', zip: 14450, status: 'inactive' },
    { name: 'Turner, Rachel', phoneNumber: '(585) 555-1019', address: '4000 Server Farm Rd', city: 'Henrietta', zip: 14467, status: 'active' },
    { name: 'Phillips, Matthew', phoneNumber: '(585) 555-1020', address: '700 Property Ln', city: 'Pittsford', zip: 14534, status: 'active' },
    { name: 'Campbell, Victoria', phoneNumber: '(585) 555-1021', address: '1800 Box St', city: 'Churchville', zip: 14428, status: 'active' },
    { name: 'Parker, Benjamin', phoneNumber: '(585) 555-1022', address: '350 Wealth Way', city: 'Rochester', zip: 14618, status: 'active' },
    { name: 'Evans, Angela', phoneNumber: '(585) 555-1023', address: '5000 Showroom Rd', city: 'Greece', zip: 14626, status: 'inactive' },
    { name: 'Edwards, Nathan', phoneNumber: '(585) 555-1024', address: '2800 Rental Plaza', city: 'Spencerport', zip: 14559, status: 'active' },
]

router.get("/users", (req, res, next) => {
    try {
        // Simulate network delay
        setTimeout(() => {
            let results = [...USERS]

            // Apply search filter
            const search = (req.query.search as string) || ''
            if (search) {
                results = results.filter(user =>
                    Object.values(user).some(value =>
                        String(value).toLowerCase().includes(search.toLowerCase())
                    )
                )
            }

            // Apply column filters (dynamic based on query params)
            Object.entries(req.query).forEach(([key, value]) => {
                if (key !== 'page' && key !== 'pageSize' && key !== 'sortBy' && key !== 'sortDir' && key !== 'search' && value) {
                    results = results.filter(user =>
                        String(user[key as keyof User])
                            .toLowerCase()
                            .includes(String(value).toLowerCase())
                    )
                }
            })

            // Apply sorting
            const sortBy = req.query.sortBy as string
            const sortDir = req.query.sortDir as 'asc' | 'desc' | undefined
            if (sortBy && sortDir) {
                results = [...results].sort((a, b) => {
                    const aVal = a[sortBy as keyof User]
                    const bVal = b[sortBy as keyof User]

                    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
                    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
                    return 0
                })
            }

            // Get total before pagination
            const total = results.length

            // Apply pagination
            const page = parseInt(req.query.page as string || '0')
            const pageSize = parseInt(req.query.pageSize as string || '10')
            const start = page * pageSize
            const paginatedResults = results.slice(start, start + pageSize)

            res.json({
                data: paginatedResults,
                total
            })
        }, 300) // 300ms delay to simulate network
    } catch (error) {
        next(error)
    }
});

router.get("/clients", (req, res, next) => {
    try {
        // Simulate network delay
        setTimeout(() => {
            let results = [...CLIENTS]

            // Apply search filter
            const search = (req.query.search as string) || ''
            if (search) {
                results = results.filter(client =>
                    Object.values(client).some(value =>
                        String(value).toLowerCase().includes(search.toLowerCase())
                    )
                )
            }

            // Apply column filters (dynamic based on query params)
            Object.entries(req.query).forEach(([key, value]) => {
                if (key !== 'page' && key !== 'pageSize' && key !== 'sortBy' && key !== 'sortDir' && key !== 'search' && value) {
                    results = results.filter(client =>
                        String(client[key as keyof Client])
                            .toLowerCase()
                            .includes(String(value).toLowerCase())
                    )
                }
            })

            // Apply sorting
            const sortBy = req.query.sortBy as string
            const sortDir = req.query.sortDir as 'asc' | 'desc' | undefined
            if (sortBy && sortDir) {
                results = [...results].sort((a, b) => {
                    const aVal = a[sortBy as keyof Client]
                    const bVal = b[sortBy as keyof Client]

                    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
                    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
                    return 0
                })
            }

            // Get total before pagination
            const total = results.length

            // Apply pagination
            const page = parseInt(req.query.page as string || '0')
            const pageSize = parseInt(req.query.pageSize as string || '10')
            const start = page * pageSize
            const paginatedResults = results.slice(start, start + pageSize)

            res.json({
                data: paginatedResults,
                total
            })
        }, 300) // 300ms delay to simulate network
    } catch (error) {
        next(error)
    }
});

export default router;
