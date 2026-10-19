import prisma from "../db/index.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSalesProducts = asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
        where: { organizationId: req.organizationId },
        orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(
        new ApiResponse(200, [], products, "Products retrieved successfully")
    );
});

export const getSalesProductById = asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
        where: { id: req.params.productId, organizationId: req.organizationId },
    });
    if (!product) throw new ApiError(404, "Product not found");

    return res.status(200).json(
        new ApiResponse(200, [], product, "Product retrieved successfully")
    );
});
