import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [credentialsEnabled, setCredentialsEnabled] = useState(false);
    const [resetMessage, setResetMessage] = useState("");

    const handlePasswordReset = async () => {
        setError("");
        setResetMessage("");
        if (!email.trim()) {
            setError("Enter your invited email address first.");
            return;
        }
        if (!auth) {
            setError("Firebase is not configured for this app.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setResetMessage("Password reset email sent. Use its link to choose a password, then sign in here.");
        } catch (resetError) {
            setError(resetError.message || "Could not send the password reset email.");
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            if (!auth) {
                throw new Error("Firebase is not configured. Copy .env.example to .env, add your Firebase web app settings, and restart Vite.");
            }

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            const idToken =
                await userCredential.user.getIdToken();

            const headers = { Authorization: `Bearer ${idToken}` };
            const superAdminResponse = await fetch(`${API_BASE_URL}/auth/super-admin/session`, {
                method: "POST",
                credentials: "include",
                headers,
            });
            const superAdminData = await superAdminResponse.json().catch(() => ({}));

            if (superAdminResponse.ok) {
                navigate("/super-admin/", { replace: true });
                return;
            }

            // A 403 means the verified Firebase UID is not in the SuperAdmin table.
            // Preserve the existing CRM login for registered non-SuperAdmin users.
            if (superAdminResponse.status !== 403) {
                throw new Error(superAdminData.message || "Could not verify Super Admin access");
            }

            // Link a Firebase account that already exists to a pending CRM
            // invitation. This also safely succeeds for already registered users.
            const displayName = userCredential.user.displayName?.trim()
                || email.trim().split("@")[0].replace(/[._-]+/g, " ");
            const [firstName, ...lastNameParts] = displayName.split(/\s+/).filter(Boolean);
            const registrationResponse = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({ firstName: firstName || "User", lastName: lastNameParts.join(" ") || null }),
            });
            const registrationData = await registrationResponse.json().catch(() => ({}));
            if (!registrationResponse.ok && registrationResponse.status !== 403) {
                throw new Error(registrationData.message || "Could not link your account to the CRM invitation");
            }

            const response = await fetch(`${API_BASE_URL}/auth/protected`, { headers });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || "Backend authentication failed");

            const destinations = {
                SALES: "/dashboard",
                USER: "/user",
                MANAGER: "/client-admin",
                ORGANIZATION_ADMIN: "/client-admin",
            };
            const destination = destinations[data.data?.role];
            if (!destination) {
                throw new Error("Your account does not have a supported CRM role.");
            }

            window.dispatchEvent(new CustomEvent("crm:authenticated", { detail: { firebaseUser: userCredential.user, crmUser: data.data } }));
            navigate(destination, { replace: true });
        } catch (error) {
            const firebaseMessages = {
                "auth/invalid-credential": "Email or password is incorrect.",
                "auth/user-not-found": "No account was found for this email.",
                "auth/wrong-password": "Email or password is incorrect.",
                "auth/invalid-email": "Enter a valid email address.",
                "auth/too-many-requests": "Too many sign-in attempts. Try again shortly.",
                "auth/network-request-failed": "Could not reach the authentication service. Check your connection.",
                "auth/internal-error": "Firebase could not access this browser session. Refresh the page and try again. If it continues, clear this site's stored data and retry.",
            };
            setError(firebaseMessages[error.code] || error.message || "Sign in failed. Please try again.");
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
                            Sign in to continue to your SHNOOR CRM account.
                        </p>
                    </div>

                    <form
                        onSubmit={handleLogin}
                        className="auth-form"
                        autoComplete="off"
                    >
                        <div className="form-group">
                            <label htmlFor="email">
                                Email address
                            </label>

                            <input
                                id="email"
                                name="crm-login-email"
                                type="email"
                                autoComplete="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                readOnly={!credentialsEnabled}
                                onFocus={() => setCredentialsEnabled(true)}
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
                                    name="crm-login-password"
                                    className="password-input"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    autoComplete="new-password"
                                    readOnly={!credentialsEnabled}
                                    onFocus={() => setCredentialsEnabled(true)}
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

                        <button type="button" className="auth-reset-link" onClick={handlePasswordReset}>
                            Forgot your password? Send a reset email
                        </button>

                        {error && (
                            <p className="auth-error">
                                {error}
                            </p>
                        )}
                        {resetMessage && <p className="auth-success" role="status">{resetMessage}</p>}

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
                        <a href="/signup">
                            Set up account
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
