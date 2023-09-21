import {Router} from "express";
import multer from "multer";
// import 'dotenv/config';
import {findAllPacks} from "../database/db"
import { fileUpload } from "../controllers/csvController";
import { findProducts, updateProducts } from "../controllers/productController";


const router = Router();
const multerConfig = multer();
router.post("/validations", multerConfig.single("csvFile"), fileUpload)

router.get("/products", findProducts)
router.patch("/att-products", updateProducts)

router.get("/packs", async (req, res) => {
    const result = await findAllPacks();
    res.json(result);
})


export { router };