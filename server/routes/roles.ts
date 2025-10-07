import express, { Router } from "express";
import * as roles from "../controllers/rolesController";

const router: Router = express.Router({ mergeParams: true });

router.get("/", roles.listRoles);
router.post("/", roles.createRole);

router.get("/:roleId", roles.getRole);
router.put("/:roleId", roles.updateRole);
router.delete("/:roleId", roles.deleteRole);

export default router;