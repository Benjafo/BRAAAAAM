import express, { Router } from "express";
import * as customForms from "../controllers/custom-forms.controller.js";
import { withPermission } from "../middleware/with-permission.js";

const router: Router = express.Router({ mergeParams: true });

// Custom forms management (admin only)
router.get("/", withPermission({ permissions: "settings.read" }), customForms.listCustomForms);
router.get("/:formId", withPermission({ permissions: "settings.read" }), customForms.getCustomForm);
router.post("/", withPermission({ permissions: "settings.update" }), customForms.createCustomForm);
router.put(
    "/:formId",
    withPermission({ permissions: "settings.update" }),
    customForms.updateCustomForm
);

// Form responses (available to users with entity permissions)
router.get("/responses/:entityType/:entityId", customForms.getEntityResponses);
router.post("/responses", customForms.saveFormResponse);

export default router;
