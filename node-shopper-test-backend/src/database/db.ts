const mysql = require('mysql2/promise');
import 'dotenv/config';
import { IProductsCorrects } from '../interfaces/IProducts';

const client = mysql.createPool(process.env.CONNECTION_STRING);

export async function findAllProducts(){
    const result = await client.query("SELECT * FROM products;");
    return result[0];
}

export async function findAllProductCodesInProducts(){
    const result = await client.query("SELECT code FROM products;");
    return result[0];
}

export async function findAllPacks(){
    const result = await client.query("SELECT * FROM packs;");
    return result[0];
}

export async function findPack(pId: number){
    const result = await client.query("SELECT * FROM packs WHERE product_id=?;", [pId]);
    return result[0];
}

export async function updateSomeProducts(newProducts: IProductsCorrects[]){
    
    try{
        const connection = await client.getConnection();

        for(const newProduct of newProducts){
            const { code, new_price } = newProduct;
            const sql = `UPDATE products SET sales_price = ? WHERE code = ?`;
            await connection.execute(sql, [new_price, code]);
            console.log(`produto code = ${code} atualizado`);
        }
        connection.release();
    }catch(error){
        console.log(error);
    }

}