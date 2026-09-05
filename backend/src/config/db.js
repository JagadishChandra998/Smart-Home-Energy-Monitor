import mongoose from "mongoose";

const connectDB = async () =>{
    try{
        const connection =await mongoose.connect(process.env.MONGODB_URI);
        console.log(`mongoDB connected:${connection.connection.host}`);
    }
    catch(error){
        console.log("Mongodb connection Fail");
        console.log(error.message);

        process.exit(1);
    }
};

export default connectDB;