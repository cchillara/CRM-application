import { useState } from "react";
import "./Auth.css";

import {
    createUserWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";

import { auth } from "../firebase";

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();

        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            await updateProfile(
                userCredential.user,
                {
                    displayName: name,
                }
            );


            const idToken =
                await userCredential.user.getIdToken();

            console.log(
                "Firebase UID:",
                userCredential.user.uid
            );


            const nameParts = name.trim().split(" ");

            const firstName = nameParts[0];

            const lastName =
                nameParts.slice(1).join(" ") || null;


            const organizationId = "52a39a42-bdbf-45a7-842e-ff6909e53a12";

            // 6. Send user information to backend
            const response = await fetch(
                "http://localhost:5000/api/v1/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },

                    body: JSON.stringify({
                        firstName,
                        lastName,
                        organizationId,
                    }),
                }
            );

            const data = await response.json();


            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to create CRM user"
                );
            }

            console.log(
                "CRM User created:",
                data
            );

            alert(
                "Account created successfully!"
            );


            window.location.href = "/login";

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
                        GET STARTED WITH SHNOOR
                    </p>

                    <h1>
                        Build better
                        <br />
                        <span>
                            customer relationships.
                        </span>
                    </h1>

                    <p className="auth-description">
                        Create your SHNOOR CRM account and start
                        managing customers, leads and deals from
                        one organized workspace.
                    </p>

                    <div className="auth-benefits">
                        <div className="auth-benefit">
                            <span>✓</span>
                            Centralize customer information
                        </div>

                        <div className="auth-benefit">
                            <span>✓</span>
                            Organize your sales workflow
                        </div>

                        <div className="auth-benefit">
                            <span>✓</span>
                            Get a clearer view of your business
                        </div>
                    </div>
                </div>

                {/* ================= RIGHT ================= */}

                <div className="auth-card">
                    <div className="auth-header">
                        <h2>Create your account</h2>

                        <p>
                            Start managing your customer relationships
                            with SHNOOR.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSignup}
                        className="auth-form"
                    >
                        <div className="form-group">
                            <label htmlFor="name">
                                Full name
                            </label>

                            <input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                required
                            />
                        </div>

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
                                    placeholder="Create a password"
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
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                >
                                    {showPassword
                                        ? "Hide"
                                        : "Show"}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                Confirm password
                            </label>

                            <div className="input-wrapper">
                                <input
                                    id="confirmPassword"
                                    className="password-input"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >
                                    {showConfirmPassword
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
                                ? "Creating account..."
                                : "Create account"}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Already have an account?{" "}
                        <a href="/login">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;
