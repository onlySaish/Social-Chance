import connectDB from "./DB/index.js";
import dotenv from 'dotenv'
import {app} from "./app.js";

dotenv.config({
    path: './.env'
})

const port = process.env.PORT || 8000;

connectDB()
.then((res) => {
    app.listen(port, () => {
        console.log("App is Listening at Port ",port);
    })
}).catch((err) => {
  console.log("DB Connection Error",err);
});







/*
import express from 'express'
const app = express()

(async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error",(error) => {
            console.log("App Error",error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is Listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("Error: ", error);
        throw err
    }
})();
*/

 
