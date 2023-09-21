import { Request, Response } from "express";
import { findAllProductCodesInProducts, findAllProducts, updateSomeProducts } from "../database/db";

export async function findProducts(request: Request, response: Response) {
    const result = await findAllProducts();
    response.json(result);
}

export async function findCodes(request: Request, response: Response) {
    const result = await findAllProductCodesInProducts();
    response.json(result);
}


export async function updateProducts(request: Request, response: Response){
    const { newProducts } = request.body;
    const result = await updateSomeProducts(newProducts)
    response.status(200).json({message: 'Produtos atualizados com sucesso'});
}
