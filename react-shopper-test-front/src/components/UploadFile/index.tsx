import axios from "axios";
import { ChangeEvent, FormEvent, useState } from "react";

import { urlApi } from "../../services/Api";
import ListCards from "../ListCards";

import { IProductsCorrects } from "../../interfaces/IProducts";
import { IErrosDoConteudo } from "../../interfaces/IErrors";
import "./style.css"

export default function UploadFile() {

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [resposta, setResposta] = useState<IProductsCorrects[] | null>(null);
  const [errorsArq, setErrorsArq] = useState<string[] | null>(null);
  const [errorsContent, setErrorsContent] = useState<IErrosDoConteudo[] | null>(null);
  const [errors, setErrors] = useState<boolean>(true);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setCsvFile(selectedFile);
    }
  };

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();

    if (csvFile) {
      const formData = new FormData();
      formData.append("csvFile", csvFile);

      try {
        const response = await axios.post(`${urlApi}/validations`, formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        const contentType = response.headers["content-type"];
        if (contentType && contentType.includes("application/json")) {
          const data = response.data;
          if (Array.isArray(data)) {
            if (
              data.length > 0 &&
              typeof data[0] === "object" &&
              "erros" in data[0]
            ) {
              setErrorsContent(response.data as IErrosDoConteudo[]);
              setResposta(null);
              setErrorsArq(null);
              setErrors(true);
            } else if (typeof data[0] === "string") {
              setErrorsArq(response.data as string[]);
              setErrorsContent(null);
              setResposta(null);
              setErrors(true);
            } else if (
              data.length > 0 &&
              typeof data[0] === "object" &&
              "old_price" in data[0]
            ) {
              setResposta(response.data as IProductsCorrects[]);
              setErrorsContent(null);
              setErrorsArq(null);
              setErrors(false);
            }
          }
        }
      } catch (error) {
        console.log("Erro:", error);
      }
    }
  };

  const handleAttDatabase = async () => {
    try {
      const response = await axios.patch(`${urlApi}/att-products`, {
        newProducts: resposta,
      });
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
    window.location.reload();
  };

  return (
    <div>
      <div>
        <form>
          <input type={"file"} onChange={handleFileChange} accept={".csv"} />
          <button type="submit" onClick={handleSubmitForm}>
            VALIDAR
          </button>
        </form>
      </div>

      <div className="container-buttons">
        {errors || <button onClick={handleAttDatabase}>ATUALIZAR</button>}
      </div>

      <div>
        {errorsArq && errorsArq.map((item, index) => <p className="erros-msg" key={index}>{item}</p>)}
      </div>
      
      <div>
        {!errors && <h3>Produtos validados:</h3> }
        <div className="container-products">

        {!errors && resposta && resposta.map((item, index) => 
              <div key={index} className="products">
                <p className="infos-product">Cód: <span>{item.code}</span></p>
                <p>{item.name}</p>
                <p className="infos-product">Preço atual: R$ <span className="price">{item.old_price}</span></p>
                <p className="infos-product">Preço novo: R$ <span className="price">{item.new_price}</span></p>
              </div>)
        }
        </div>
      </div>
        
      <div>
        <ListCards parentToChildErrors={errorsContent} />
        
      </div>

    </div>
  );
}
