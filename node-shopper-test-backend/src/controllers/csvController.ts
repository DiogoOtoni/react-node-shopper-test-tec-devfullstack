import { Request, Response } from "express";
import { Readable } from "stream";
import readline from "readline";

import { findAllPacks, findAllProductCodesInProducts, findAllProducts } from "../database/db";

import { IDocCsv } from "../interfaces/IDocCsv";
import { ICodes, IProducts, IProductsCorrects } from "../interfaces/IProducts";
import { IErrosDoConteudo } from "../interfaces/IErrors";
import { IPacks } from "../interfaces/IPacks";

export async function fileUpload(request: Request, response: Response) {
    const { file } = request;
    const buffer = file?.buffer;
    const csvDoc: IDocCsv[] = [];
    
    const errorsDeArquivo: string[] = [];
    const errorsDeProducts: IErrosDoConteudo[][] = [];

    let count: number = 0;

    const readableFile = new Readable();
    readableFile.push(buffer);
    readableFile.push(null);

    const csvLines = readline.createInterface({
        input: readableFile
    });

    /**
     * Lendo o arquivo linha por linha para primeiro separar os headers
     * e depois salvar o conteudo na variavel "csvDoc", como um vetor de objetos do tipo IDocCsv
     */
    for await (let line of csvLines) {
        const csvLine = line.split(",");
        if (count === 0) {
            csvDoc.push({
                product_code: csvLine[0],
                new_price: csvLine[1]
            });
        } else {
            csvDoc.push({
                product_code: Number(csvLine[0]),
                new_price: Number(csvLine[1])
            });
        }
        count++;
    }

    const csvDocSanitize = csvDoc.slice(1);

    const result1 = hasFieldsInHeaders(csvDoc);
    if(result1 != null){
        errorsDeArquivo.push(result1);
    }
    const result2 = await hasProductCodes(csvDocSanitize);
    if(result2 != null){
        errorsDeArquivo.push(result2);
    }
    const result3 = isNumberValuesInDocument(csvDocSanitize);
    if(result3 != null){
        errorsDeArquivo.push(result3);
    }
    if(errorsDeArquivo.length > 0){
        return response.json(errorsDeArquivo);
    }
    const result4 = await notLessThanCostPrice(csvDocSanitize);
    if(result4 != null){
        errorsDeProducts.push(result4);
    }
    const result5 = await verifiedProductPriceAndPacks(csvDocSanitize);
    if(result5 != null){
        errorsDeProducts.push(result5);
    }

    if(errorsDeProducts.length > 0){
        return response.json(errorsDeProducts.flat());
    }

    const returnProducts = await allProductsAreCorrets(csvDocSanitize);
    return response.json(returnProducts);
}

/**
 * Função que verifica se os campos são os que são para ser.
 * @param csvDoc Documento CSV completo recebido do Front-end
 * @returns null ou o nome do erro para integração ao array de objetos de erros
 */
function hasFieldsInHeaders(csvDoc: IDocCsv[]): string | null {
    const productCode = 'product_code';
    const newPrice = "new_price";
    const result = csvDoc.find((obj) => {
        return obj.product_code == productCode && obj.new_price == newPrice
    });
    if (result) {
        return null;
    } else {
        return "Erro: Arquivo sem os headers corretos.";
    }
}

/**
 * Função que verifica se o Documento CSV contém os códigos de produtos existentes
 * @param csvDoc Documento CSV sanitizado
 * @returns null ou a string detalhando o erro para array de objetos de erros
 */
async function hasProductCodes(csvDoc: IDocCsv[]): Promise<null | string> {
    const codes: ICodes[] = await findAllProductCodesInProducts();
    for (let item of csvDoc){
        const resultSome = codes.some(code => {
            return code.code == item.product_code;
        });

        if(!resultSome){
            return "Erro: Arquivo sem algum código de produto válido";
        }
    }
    return null;
}

/**
 * função que verifica se os números de novo preço do documento são números válidos
 * @param csvDoc Documento CSV sanitizado
 * @returns retorna o nome do erro ou null
 */
function isNumberValuesInDocument(csvDoc: IDocCsv[]): string | null{
    const errorName = "Erro: Algum preço no arquivo não é um número válido";
    const mapArray = csvDoc.map((item) => {
        if(isNaN(Number(item.new_price))){
            return errorName;
        }else{
            return null;
        }
    })
    const result = mapArray.find(item => item == errorName);
    if(result){
        return errorName;
    }else{
        return null;
    }  
}

//REGRAS DO CENÁRIO:
//new price nao pode ser menor que preço de custo
/**
 * Função que verifica se novos preços estão abaixo do preço de custo do produto
 * @param csvDoc CSV sanitizado
 * @returns retorna ou array de erros para cada product_code ou null caso não tenha erros
 */
async function notLessThanCostPrice(csvDoc: IDocCsv[]){
    const products:IProducts[] = await findAllProducts();
    const errors: IErrosDoConteudo[] = [];

    for(let item of csvDoc){
        for(let prod of products){
            if(item.product_code == prod.code){
                if(Number(item.new_price) < Number(prod.cost_price)){
                    const er: IErrosDoConteudo = {
                        product_code: Number(item.product_code),
                        erros: "Erro: Novo preço menor que preço de custo",
                    }
                    errors.push(er);
                }
                const priceUp = Number(prod.sales_price) + (Number(prod.sales_price) * 0.1);
                const priceDown = Number(prod.sales_price) - (Number(prod.sales_price) * 0.1);
                if((Number(item.new_price) < priceDown) || (Number(item.new_price) > priceUp)){
                    const er: IErrosDoConteudo = {
                        product_code: Number(item.product_code),
                        erros: "Erro: Variação do novo preço maior que 10%",
                    }
                    errors.push(er);
                }
            }
        }
    }
    if(errors.length == 0){
        return null;
    }else{
        return errors;
    }
}

async function verifiedProductPriceAndPacks(csvDoc: IDocCsv[]) {
    const packs: IPacks[] = await findAllPacks();
    const products: IProducts[] = await findAllProducts();
    const errors: IErrosDoConteudo[] = [];
    
    for (let item of csvDoc) {
        for (let pack of packs) {
            const erroFaltaProduto: IErrosDoConteudo = {
                product_code: Number(item.product_code), 
                erros: "Erro: Falta produto do pack de produtos."
            }
            const erroPrecoPackErrado: IErrosDoConteudo = {
                product_code: Number(item.product_code), 
                erros: "Erro: Novo preço do pack ou do item errado."
            }

            if (Number(item.product_code) == Number(pack.pack_id)) {
                const packItems = packs.filter((p) => p.pack_id == pack.pack_id);

                let packValue: number = 0;
                let missProduct: number = 0;
                for (let i = 0; i < packItems.length; i++) {
                    const element = csvDoc.find((el) => el.product_code == packItems[i].product_id);

                    if (packItems.length == 1 && element == undefined) {
                        errors.push(erroFaltaProduto);
                
                    }
                    if(element != undefined) {
                        packValue = packValue + (packItems[i].qty * Number(element.new_price));
                    }else{
                        missProduct++;
                        const missElement = products.find((el) => el.code == packItems[i].product_id);
                        packValue = packValue + (Number(packItems[i].qty) * Number(missElement?.sales_price));
                    }
                }
                if(missProduct == packItems.length && packItems.length > 1){
                    errors.push(erroFaltaProduto);
                }
                if (Number(packValue.toFixed(2)) != Number(item.new_price)) {
                    
                    errors.push(erroPrecoPackErrado);
                
                }
                packValue = 0;
            }
        }
    }
    if(errors.length == 0){
        return null;
    }else{
        return errors;
    }
}


async function allProductsAreCorrets(csvDoc: IDocCsv[]){
    const products: IProducts[] = await findAllProducts();
    const returnProducts: IProductsCorrects[] = [];

    for(let csvItem of csvDoc){
        for(let product of products){

            if(csvItem.product_code == product.code){
                const element:IProductsCorrects = {
                    code: product.code,
                    name: product.name,
                    old_price: Number(product.sales_price),
                    new_price: Number(csvItem.new_price),
                }
                returnProducts.push(element);
            }
        }
    }
    return returnProducts;
}