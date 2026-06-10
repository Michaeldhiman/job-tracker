import { Router } from "express";
import auth from "../middleware/auth.js";
import { exportAllData, exportResumesZip } from "../controllers/exportController.js";

const router = Router();
router.use(auth);

router.get("/all", exportAllData);
router.get("/resumes", exportResumesZip);

export default router;
