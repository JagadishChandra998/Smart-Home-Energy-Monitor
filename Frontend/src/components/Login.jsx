import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import api from "../api/axios.js"

export default function Login() {

    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(false);
    // const [showPassword, setshowPassword] = useState(false);


    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        if (isLogin) {

            if (!email || !password) {
                setError("Please enter both email and password.");
                setLoading(false);
                return;
            }

            try {
                const response = await api.post("/auth/login", {
                    email,
                    password,
                });

                console.log("LOGIN RESPONSE:", response.data);

                localStorage.setItem(
                    "token",
                    response.data.token
                );

                // localStorage.setItem(
                //     "role",
                //     response.data.user.role
                // );

                navigate("/home");

            } catch (error) {
                console.error("LOGIN ERROR:", error);

                setError(
                    error.response?.data?.message ||
                    "Login failed"
                );
            }

        } else {

            if (!fullName || !email || !password || !confirmPassword) {
                setError("Please fill in all registration fields.");
                setLoading(false);
                return;
            }

            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setLoading(false);
                return;
            }

            try {
                const response = await api.post("/auth/register", {
                    fullname: fullName,
                    email,
                    password,
                });

                console.log("REGISTER RESPONSE:", response.data);

                alert("Registration successful");

                setIsLogin(true);

            } catch (error) {
                console.error("REGISTER ERROR:", error);

                setError(
                    error.response?.data?.message ||
                    "Registration failed"
                );
            }
        }

        setLoading(false);
    };


    return (
        <section className="header" >
            <p className="register">{isLogin ? "Login form" : "Registration form"}</p>
            <h1 className="register-title">{isLogin ? "Login" : "Registration"}</h1>
            <p className="register-description">
                {isLogin
                    ? "Sign in to continue managing inventory and billing."
                    : "Create an account to manage inventory and billing from one dashboard."}
            </p>

            <form onSubmit={handleSubmit} className="user-form" autoComplete="on">
                {!isLogin && (
                    <>
                        <input
                            type="text"
                            className="user-input"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                        />
                        {/* <input
                            type="tel"
                            className="user-input"
                            placeholder="Phone Number"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                        /> */}
                    </>
                )}

                <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    className="user-input"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    className="user-input"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  
                />
               
                {!isLogin && (
                    <input
                        type="password"
                        className="user-input"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                )}

                <button type="submit" disabled={loading} className="login-button">
                    {loading ? (isLogin ? "Signing in..." : "Creating account...") : isLogin ? "Login" : "Register"}
                </button>
                <p className="login-toggle">
                    {isLogin ? "New here?" : "Already registered?"}{" "}
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="login-toggle-button">
                        {isLogin ? "Create account" : "Login"}
                    </button>
                </p>
                {error ? <p className="login-error">{error}</p> : null}
            </form>
        </section>
    );
}