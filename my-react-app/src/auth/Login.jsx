import "./Auth.css";

function Login() {
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


                    <form>

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
                                placeholder="Enter your password"
                            />

                        </div>


                        <button
                            type="submit"
                            className="auth-button"
                        >
                            Login
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
