import { Request, Response } from "express";

/*
 * Example Output
    {
    "startDate": "string",
    "startTime": "string",
    "estimatedEndDate": "string",
    "estimatedEndTime": "string",
    "Client": [
        "string"
    ],
    "pickupLocation": "string",
    "dropoffLocation": "string",
    "status": "string"
    }
 */

interface Appointment {
    id: string;
    startDate: string;
    startTime: string;
    estimatedEndDate: string;
    estimatedEndTime: string;
    client: string[];
    pickupLocation: string;
    dropoffLocation: string;
    status: string;
}

interface Tag {
    id: string;
    name: string;
}

const appointments: Appointment[] = [];
const tags: Tag[] = [];


export const listAppointments = (req: Request, res: Response): Response => {
    return res.status(200).json(appointments);
    // return res.status(500).send();
};

export const createAppointment = (req: Request, res: Response): Response => {
    const data = req.body;
    if (
        !data.startDate ||
        !data.startTime ||
        !data.estimatedEndDate ||
        !data.estimatedEndTime ||
        !data.client ||
        !data.pickupLocation ||
        !data.dropoffLocation ||
        !data.status
    ) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const newAppointment: Appointment = {
        id: (appointments.length + 1).toString(),
        startDate: data.startDate,
        startTime: data.startTime,
        estimatedEndDate: data.estimatedEndDate,
        estimatedEndTime: data.estimatedEndTime,
        client: data.client,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        status: data.status,
    };
    appointments.push(newAppointment);
    return res.status(201).json(newAppointment);
    // return res.status(500).send();
};

export const getAppointment = (req: Request, res: Response): Response => {
    const { appointmentId } = req.params;
    const appointment = appointments.find((a) => a.id === appointmentId);

    if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json(appointment);
    // return res.status(500).send();
};

export const updateAppointment = (req: Request, res: Response): Response => {
    const { appointmentId } = req.params;
    const data = req.body;

    const index = appointments.findIndex((a) => a.id === appointmentId);

    // No appointment with fetched ID
    if (index === -1) {
        return res.status(404).json({ message: "Appointment not found" });
    }

    appointments[index] = { ...appointments[index], ...data };
    return res.status(200).json(appointments[index]);
    // return res.status(500).send();
};

export const listTags = (req: Request, res: Response): Response => {
    return res.status(200).json(tags);
    // return res.status(500).send();
};

export const createTag = (req: Request, res: Response): Response => {
    const data = req.body;

    if (!data.name) {
        return res.status(400).json({ message: "Tag name is required" });
    }

    // If no ID is given or it's invalid/not found, create one from tags.length + 1
    if (!data.id || !tags.find((t) => t.id === data.id)) {
        data.id = (tags.length + 1).toString();
    }

    const newTag: Tag = {
        id: data.id,
        name: data.name,
    };

    tags.push(newTag);
    return res.status(201).json(newTag);
};


export const updateTag = (req: Request, res: Response): Response => {
    const { tagId } = req.params;
    const data = req.body;

    const index = tags.findIndex((t) => t.id === tagId);
    if (index === -1) {
        return res.status(404).json({ message: "Tag not found" });
    }

    if (!data.name) {
        return res.status(400).json({ message: "Tag name is required" });
    }

    tags[index].name = data.name;
    return res.status(200).json(tags[index]);
    // return res.status(500).send();
};

export const deleteTag = (req: Request, res: Response): Response => {
    const { tagId } = req.params;
    const index = tags.findIndex((t) => t.id === tagId);

    if (index === -1) {
        return res.status(404).json({ message: "Tag not found" });
    }

    tags.splice(index, 1);
    return res.status(204).send();
    // return res.status(500).send();
};
