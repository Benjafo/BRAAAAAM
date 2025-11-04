import express, { Router } from "express";
import * as roles from "../controllers/roles.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

router.get("/", withPermission({ permissions: "roles.read" }), roles.listRoles);
router.post("/", withPermission({ permissions: "roles.create" }), roles.createRole);

router.get("/:roleId", withPermission({ permissions: "roles.read" }), roles.getRole);
router.put("/:roleId", withPermission({ permissions: "roles.update" }), roles.updateRole);
// router.delete("/:roleId", withPermission({ permissions: "roles.delete" }), roles.deleteRole);

export default router;
