import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const idToken =
                await userCredential.user.getIdToken();

            localStorage.setItem("token", idToken);
            localStorage.setItem("firebaseToken", idToken);

            const headers = { Authorization: `Bearer ${idToken}` };
            const superAdminResponse = await fetch(`${API_BASE_URL}/auth/super-admin/session`, {
                method: "POST",
                credentials: "include",
                headers,
            });
            const superAdminData = await superAdminResponse.json().catch(() => ({}));

            if (superAdminResponse.ok) {
                window.location.replace("/super-admin/");
                return;
            }

            // A 403 means the verified Firebase UID is not in the SuperAdmin table.
            // Preserve the existing CRM login for registered non-SuperAdmin users.
            if (superAdminResponse.status !== 403) {
                throw new Error(superAdminData.message || "Could not verify Super Admin access");
            }

            const response = await fetch(`${API_BASE_URL}/auth/protected`, { headers });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || "Backend authentication failed");

            const destinations = {
                SALES: "/dashboard",
                MANAGER: "/client-admin",
                ORGANIZATION_ADMIN: "/client-admin",
            };
            const destination = destinations[data.data?.role] || "/client-admin";
            navigate(destination, { replace: true });
        } catch (error) {
            const firebaseMessages = {
                "auth/invalid-credential": "Email or password is incorrect.",
                "auth/user-not-found": "No account was found for this email.",
                "auth/wrong-password": "Email or password is incorrect.",
                "auth/invalid-email": "Enter a valid email address.",
                "auth/too-many-requests": "Too many sign-in attempts. Try again shortly.",
                "auth/network-request-failed": "Could not reach the authentication service. Check your connection.",
            };
            setError(firebaseMessages[error.code] || error.message || "Sign in failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Welcome Back</h2>
                <p className="subtitle">
                    Please enter your details to sign in
                </p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{" "}
                    <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
