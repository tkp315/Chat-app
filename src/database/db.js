import mongoose from 'mongoose'

import { DB_NAME } from '../constants.js'

const connectToDB = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        console.log(`DB Connected Name: ${DB_NAME}`)
    } catch (error) {
        console.log("Failed To Connect DB");
    }
}

export {connectToDB}