import { useState } from "react";
import "./Auth.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            // 1. Login through Firebase
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            // 2. Get Firebase ID token
            const idToken = await userCredential.user.getIdToken();

            console.log("Firebase ID Token:", idToken);

            // 3. Send token to your Express backend
            const response = await fetch(
                "http://localhost:5000/api/v1/auth/protected",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Backend authentication failed");
            }

            console.log("Backend response:", data);

            alert("Login successful!");

        } catch (error) {
            console.error(error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-container">

                <div className="auth-info">

                    <div className="auth-logo">
                        SHNOOR<span>.</span>
                    </div>

                    <p className="auth-small-title">
                        CUSTOMER RELATIONSHIP MANAGEMENT
                    </p>

                    <h1>
                        Manage your customers.
                        <br />
                        <span>Grow your business.</span>
                    </h1>

                    <p className="auth-description">
                        Access your SHNOOR CRM account and manage customers,
                        leads, deals and business activities from one place.
                    </p>

                </div>

                <div className="auth-card">

                    <div className="auth-header">

                        <h2>Welcome Back</h2>

                        <p>
                            Login to your SHNOOR CRM account
                        </p>

                    </div>

                    <form onSubmit={handleLogin}>

                        <div className="form-group">

                            <label htmlFor="email">
                                Email Address
                            </label>

                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="password">
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                        </div>

                        {error && (
                            <p className="auth-error">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>

                    </form>

                    <p className="auth-switch">
                        Don't have an account?
                        <a href="/signup"> Create an account</a>
                    </p>

                </div>

            </div>

        </div>
    );
}

export default Login;
