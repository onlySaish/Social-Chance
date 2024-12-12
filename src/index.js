import connectDB from "./DB/index.js";
import express from 'express';
import dotenv from 'dotenv'

dotenv.config({
    path: './env'
})

connectDB()
// const app = express();



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

 
