/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import axios from "axios";

import { urlApi } from "../../services/Api";

import { IProducts } from "../../interfaces/IProducts";
import { IErrosDoConteudo } from "../../interfaces/IErrors";
import "./style.css";

export default function ListCards({  parentToChildErrors }) {
  const [products, setProducts] = useState<IProducts[] | null>(null);
  const errorsContent: IErrosDoConteudo[] = parentToChildErrors;

  useEffect(() => {
    axios
      .get(`${urlApi}/products`)
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  function handleErrorsContent(codigo: number): string[] | null {
    if (errorsContent) {
      return errorsContent
        .filter((el) => el.product_code == codigo)
        .map((item) => item.erros);
    }
    return null;
  }

  return (
    <div className="container">
      <h2>Produtos: </h2>
      <div className="container-products">
        {products?.map((item: IProducts) => (
          <div key={item.code} className="products">
            <p className="infos-product">Cód: <span>{item.code}</span></p>
            <p>{item.name}</p>
            <p className="infos-product">Preço de custo: R$ <span className="price">{item.cost_price}</span></p>
            <p className="infos-product">Preço de venda: R$ <span className="price">{item.sales_price}</span></p>
            {handleErrorsContent(item.code)?.map((item, index) => (
              <p key={index} className="erros-msg">
                {item}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
