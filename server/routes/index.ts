import { Router } from "express";
const router = Router();

/* GET home page. */
router.get("/", function (_req, res, _next) {
    res.json({ message: "Welcome to Express", title: "Express" });
});

export default router;
