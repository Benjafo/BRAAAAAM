import express, { Router } from "express";
import * as clients from "../controllers/clients.controller";

const router: Router = express.Router({ mergeParams: true });

router.get("/", clients.listClients);
router.post("/", clients.createClient);

router.get("/:clientId", clients.getClient);
router.put("/:clientId", clients.updateClient);
router.delete("/:clientId", clients.deleteClient);

export default router;