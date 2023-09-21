


export interface IProducts{
    code: number;
    name: string;
    cost_price: number;
    sales_price: number;
    
}

export interface ICodes{
    code: number;
}

export interface IProductsCorrects{
    code: number;
    name: string;
    old_price: number;
    new_price: number;
}