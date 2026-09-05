import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullname:{
            type:String,
            require:true,
            trim: true,
        },
        email:{
            type:String,
            require:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        password:{
            type:String,
            require:true,
            minlength:6,
        }
    },
    
    {
        timestamps:true,
    },
);

const User = mongoose.model("User", userSchema);
export default User;