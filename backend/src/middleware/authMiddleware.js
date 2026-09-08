import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) =>{
    try{
        const token = req.headers.authorization?.split(" ")[1];

        if(!token){
            return res.status(401).json({
                success:false,
                message:"Authentication request"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;
        next();
    }
    catch(error){
        console.log("authmiddleware Error:" ,error);
        res.status(500).json({
            success:false,
            message:"Server Error"
        });
    }
};