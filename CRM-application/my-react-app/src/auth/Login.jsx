import { useState } from "react";
import "./Auth.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");
const SUPER_ADMIN_URL = import.meta.env.VITE_SUPER_ADMIN_URL || "http://localhost:5174";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            if (!auth) {
                throw new Error("Firebase is not configured. Copy .env.example to .env, add your Firebase web app settings, and restart Vite.");
            }

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const idToken =
                await userCredential.user.getIdToken();

            const headers = { Authorization: `Bearer ${idToken}` };
            const superAdminResponse = await fetch(`${API_BASE_URL}/super-admin/organizations`, { headers });
            const superAdminData = await superAdminResponse.json().catch(() => ({}));

            if (superAdminResponse.ok) {
                window.location.assign(`${SUPER_ADMIN_URL}/#token=${encodeURIComponent(idToken)}`);
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

                {/* ================= LEFT ================= */}

                <div className="auth-info">
                    <div className="auth-logo">
                        SHNOOR<span>.</span>
                    </div>

                    <p className="auth-small-title">
                        CUSTOMER RELATIONSHIP MANAGEMENT
                    </p>

                    <h1>
                        Manage your
                        <br />
                        customers.
                        <br />
                        <span>Grow your business.</span>
                    </h1>

                    <p className="auth-description">
                        Access your SHNOOR CRM account and manage
                        customers, leads, deals and business activities
                        from one organized workspace.
                    </p>

                    <div className="auth-benefits">
                        <div className="auth-benefit">
                            <span>✓</span>
                            Manage customers in one place
                        </div>

                        <div className="auth-benefit">
                            <span>✓</span>
                            Track leads and opportunities
                        </div>

                        <div className="auth-benefit">
                            <span>✓</span>
                            Understand your business activity
                        </div>
                    </div>
                </div>

                {/* ================= RIGHT ================= */}

                <div className="auth-card">
                    <div className="auth-header">
                        <h2>Welcome back</h2>

                        <p>
                            Sign in to continue to your SHNOOR CRM
                            account.
                        </p>
                    </div>

                    <form
                        onSubmit={handleLogin}
                        className="auth-form"
                    >
                        <div className="form-group">
                            <label htmlFor="email">
                                Email address
                            </label>

                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="input-wrapper">
                                <input
                                    id="password"
                                    className="password-input"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    {showPassword
                                        ? "Hide"
                                        : "Show"}
                                </button>
                            </div>
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
                            {loading
                                ? "Signing in..."
                                : "Sign in"}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Don't have an account?{" "}
                        <a href="/signup">
                            Create an account
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
