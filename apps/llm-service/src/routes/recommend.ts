import { Router } from "express";
import { getProvider } from "../providers";
import { getCacheKey, getCached, setCached } from "../cache/dedupe";
import { validateRecommendationInput } from "../utils/requestValidation";

const router = Router();

router.post("/recommend", async (req, res, next) => {
    try {
        const input = validateRecommendationInput(req.body);
        const cacheKey = getCacheKey(input);
        const cached = getCached(cacheKey);

        if (cached) {
            return res.json({ ...cached, cached: true });
        }

        const provider = getProvider();
        const result = await provider.recommend(input);

        setCached(cacheKey, result);

        res.json({ ...result, cached: false });
    } catch (error) {
        next(error);
    }
});

export default router;
