import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const register = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        if (!fullname || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        };

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User alreadu Exist",
            });
        };

        const hashedPassword = await bcrypt.hash(password, 10);

        //create User
        const user = await User.create({
            fullname,
            email,
            password: hashedPassword,
        });

        res.status(200).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email
            }
        });

    }
    catch (error) {
        console.log("register Error :", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        })
    };
};

export const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "email and password fields are required"
            });
        };

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            })
        };

        // console.log("USER:", user);
        // console.log("ENTERED PASSWORD:", password);
        // console.log("STORED PASSWORD:", user?.password);

        const IsPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!IsPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "invalid email or password"
            });
        };

        //create jwt
        const token = jwt.sign(
            {
                id: user._id
            },
            process.env.jwt_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            User: {
                id:user._id,
                fullname: user.fullname,
                email: user.email
            }
        });

    }
    catch (error) {
        console.log("login:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    };
};