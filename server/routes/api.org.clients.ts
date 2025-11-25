import express, { Router } from "express";
import * as clients from "../controllers/clients.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

router.get("/", withPermission({ permissions: "clients.read" }), clients.listClients);
router.get("/check-duplicates", withPermission({ permissions: "clients.read" }), clients.checkDuplicates);
router.post("/", withPermission({ permissions: "clients.create" }), clients.createClient);

router.get(
    "/:clientId",
    withPermission({ permissions: ["clients.read", "appointmentclients.read"] }),
    clients.getClient
);
router.put("/:clientId", withPermission({ permissions: "clients.update" }), clients.updateClient);
// router.delete("/:clientId", withPermission({ permissions: "clients.delete" }), clients.deleteClient);

export default router;
