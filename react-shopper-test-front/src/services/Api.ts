/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from "axios";

export const urlApi = "http://localhost:8000/api";

const Api = axios.create({
    baseURL: urlApi
});

export default Api;

