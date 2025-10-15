import { Request, Response } from "express";

/*
 * Example User Output
    {
        "firstName": "string",
        "lastName": "string",
        "Email": "string",
        "Phone": "string"
    }
 * Example Unavailability Output
    {
        "startDate": "string",
        "startTime": "string",
        "endDate": "string",
        "endTime": "string"
    }
 */

interface Unavailability {
    id: string;
    startDate: string;
    startTime?: string;
    endDate: string;
    endTime?: string;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    contactPreference?: string;
    notes?: string;
    isActive?: boolean;
    unavailability?: Unavailability[];
}

const users: User[] = [];


export const listUsers = (req: Request, res: Response): Response => {
    return res.status(200).json(users);
    // return res.status(500).send();
};

export const createUser = (req: Request, res: Response): Response => {
    const data = req.body;

    if (!data.firstName || !data.lastName || !data.email || !data.phone) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // If no ID is given or it's already used, create one
    if (!data.id || users.find((u) => u.id === data.id)) {
        data.id = (users.length + 1).toString();
    }

    const newUser: User = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        contactPreference: data.contactPreference,
        notes: data.notes,
        isActive: data.isActive ?? true,
        unavailability: [],
    };

    users.push(newUser);
    return res.status(201).json(newUser);
    // return res.status(500).send();
};

export const getUser = (req: Request, res: Response): Response => {
    const { userId } = req.params;
    const user = users.find((u) => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
    // return res.status(500).send();
};

export const updateUser = (req: Request, res: Response): Response => {
    const { userId } = req.params;
    const data = req.body;

    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
        return res.status(404).json({ message: "User not found" });
    }

    users[index] = { ...users[index], ...data };
    return res.status(200).json(users[index]);
    // return res.status(500).send();
};

export const deleteUser = (req: Request, res: Response): Response => {
    const { userId } = req.params;

    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
        return res.status(404).json({ message: "User not found" });
    }

    users.splice(index, 1);
    return res.status(204).send();
    // return res.status(500).send();
};

export const createUnavailability = (req: Request, res: Response): Response => {
    const { userId } = req.params;
    const data = req.body;

    const user = users.find((u) => u.id === userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!data.startDate || !data.endDate) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const newUnavailability: Unavailability = {
        id: (user.unavailability?.length || 0 + 1).toString(),
        startDate: data.startDate,
        startTime: data.startTime,
        endDate: data.endDate,
        endTime: data.endTime,
    };

    user.unavailability = user.unavailability || [];
    user.unavailability.push(newUnavailability);

    return res.status(201).json(newUnavailability);
    // return res.status(500).send();
};

export const listUnavailability = (req: Request, res: Response): Response => {
    const { userId } = req.params;
    const user = users.find((u) => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.unavailability || []);
    // return res.status(500).send();
};

export const updateUnavailability = (req: Request, res: Response): Response => {
    const { userId, unavailabilityId } = req.params;
    const data = req.body;

    const user = users.find((u) => u.id === userId);
    if (!user || !user.unavailability) {
        return res.status(404).json({ message: "User or unavailability not found" });
    }

    const index = user.unavailability.findIndex((u) => u.id === unavailabilityId);
    if (index === -1) {
        return res.status(404).json({ message: "Unavailability not found" });
    }

    user.unavailability[index] = { ...user.unavailability[index], ...data };
    return res.status(200).json(user.unavailability[index]);
    // return res.status(500).send();
};

export const deleteUnavailability = (req: Request, res: Response): Response => {
    const { userId, unavailabilityId } = req.params;

    const user = users.find((u) => u.id === userId);
    if (!user || !user.unavailability) {
        return res.status(404).json({ message: "User or unavailability not found" });
    }

    const index = user.unavailability.findIndex((u) => u.id === unavailabilityId);
    if (index === -1) {
        return res.status(404).json({ message: "Unavailability not found" });
    }

    user.unavailability.splice(index, 1);
    return res.status(204).send();
    // return res.status(500).send();
};