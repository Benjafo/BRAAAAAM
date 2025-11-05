import express, { Router } from "express";
import * as orgs from "../controllers/organizations.controller.js";

const router: Router = express.Router();

// /s/organizations
router.get("/", orgs.listOrganizations);
router.post("/", orgs.createOrganization);

// /s/organizations/:orgId
router.get("/:orgId", orgs.getOrganization);
router.put("/:orgId", orgs.updateOrganization);

export default router;
