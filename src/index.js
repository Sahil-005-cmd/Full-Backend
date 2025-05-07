// require("dotenv").config()
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import express from "express";
import app from "./app.js";

dotenv.config({
    path:"./env"
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 5000,()=>{
        console.log(`App running on port:${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Database connection failed:",err)
})







/*
const app = express()
;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(err)=>{
            console.log("Error is:"+err)
            throw err
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is running on the port:${process.env.PORT}`)
        })
    } catch (err) {
        console.error(`Error is:${err}`)
        throw err
    }
})()
*/