import { useState } from "react";
import "./Auth.css";
import {
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { auth } from "../firebase";

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();

        setError("");

        // Check password confirmation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            // Create Firebase user
            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            // Save user's name in Firebase profile
            await updateProfile(userCredential.user, {
                displayName: name,
            });

            console.log("User created:", userCredential.user);

            alert("Account created successfully!");

            // Go to login page
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
                        <span>customer relationships.</span>
                    </h1>

                    <p className="auth-description">
                        Create your SHNOOR CRM account and start managing
                        customers, leads and deals from one organized workspace.
                    </p>

                </div>

                <div className="auth-card">

                    <div className="auth-header">

                        <h2>Create Account</h2>

                        <p>
                            Create your SHNOOR CRM account
                        </p>

                    </div>

                    <form onSubmit={handleSignup}>

                        <div className="form-group">

                            <label htmlFor="name">
                                Full Name
                            </label>

                            <input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />

                        </div>

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
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="confirmPassword">
                                Confirm Password
                            </label>

                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
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
                            {loading
                                ? "Creating Account..."
                                : "Create Account"}
                        </button>

                    </form>

                    <p className="auth-switch">
                        Already have an account?
                        <a href="/login"> Login</a>
                    </p>

                </div>

            </div>

        </div>
    );
}

export default Signup;
