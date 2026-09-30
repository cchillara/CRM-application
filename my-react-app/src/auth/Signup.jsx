import "./Auth.css";

function Signup() {
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


                    <form>

                        <div className="form-group">

                            <label htmlFor="name">
                                Full Name
                            </label>

                            <input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
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
                            />

                        </div>


                        <button
                            type="submit"
                            className="auth-button"
                        >
                            Create Account
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
