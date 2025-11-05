import { Request, Response } from "express";

interface Report {
    id: string;
    title: string;
    query: string;
}

const reports: Report[] = [];

export const listReports = (req: Request, res: Response): Response => {
    return res.status(200).json(reports);
    // return res.status(500).send();
};

export const createReport = (req: Request, res: Response): Response => {
    const data = req.body;

    if (!data.title || !data.query) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // If no ID is given or it's already used, create one from reports.length + 1
    if (!data.id || reports.find((r) => r.id === data.id)) {
        data.id = (reports.length + 1).toString();
    }

    const newReport: Report = {
        id: data.id,
        title: data.title,
        query: data.query,
    };

    reports.push(newReport);
    return res.status(201).json(newReport);
    // return res.status(500).send();
};

export const getReport = (req: Request, res: Response): Response => {
    const { reportId } = req.params;
    const report = reports.find((r) => r.id === reportId);

    if (!report) {
        return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json(report);
    // return res.status(500).send();
};

export const updateReport = (req: Request, res: Response): Response => {
    const { reportId } = req.params;
    const data = req.body;

    const index = reports.findIndex((r) => r.id === reportId);
    if (index === -1) {
        return res.status(404).json({ message: "Report not found" });
    }

    // Merge existing report data with new fields
    reports[index] = { ...reports[index], ...data };
    return res.status(200).json(reports[index]);
    // return res.status(500).send();
};

export const deleteReport = (req: Request, res: Response): Response => {
    const { reportId } = req.params;

    const index = reports.findIndex((r) => r.id === reportId);
    if (index === -1) {
        return res.status(404).json({ message: "Report not found" });
    }

    reports.splice(index, 1);
    return res.status(204).send();
    // return res.status(500).send();
};

export const generateReport = (req: Request, res: Response): Response => {
    const { reportId } = req.params;
    const report = reports.find((r) => r.id === reportId);

    if (!report) {
        return res.status(404).json({ message: "Report not found" });
    }

    return res.status(202).json({ message: `Report ${reportId} generated` });
    // return res.status(500).send();
};
