const {
    generateAccessToken,
    generateRefreshToken,
    generatePasswordResetToken,
    verifyRefreshToken,
    verifyPasswordResetToken,
} = require("../utils/jwt");
const { hashPassword, comparePassword } = require("../utils/password");

// TODO: remove this shit, use database
const USERS = [
    {
        id: 1,
        email: "admin@gmail.com",
        name: "Admin User",
        password: "$2b$10$0DwdOLdi0gkCcN81XcdxYuzKcacUYLUwNjvljWlZf84uDyodkPfSW", // password123
    },
    {
        id: 2,
        email: "driver@gmail.com",
        name: "Driver user",
        password: "$2b$10$/psMsbxSQ5J03m5xVQdcu.xqZiKvE14D..WTgdNXQTNUFfaK9pCiS", // password1234
    },
    {
        id: 3,
        email: "dispatcher@gmail.com",
        username: "Dispatcher user",
        password: "$2b$10$T5Y5pXqefGjzqxHrSfbMEu4L4oebFsSSyyEHBAAI3mF4CQg6UC1yi", // password12345
    },
];

// TODO: remove this shit also, use database
const refreshTokenStore = new Map();
const passwordResetTokenStore = new Map();

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // TODO: replace with database query
        console.log("Attempting login for:", email);
        const user = USERS.find((u) => u.email === email);

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const userPayload = {
            id: user.id,
            email: user.email,
            username: user.username,
        };

        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken(userPayload);

        // TODO: replace with database query
        const userTokens = refreshTokenStore.get(user.id) || [];
        userTokens.push(refreshToken);
        refreshTokenStore.set(user.id, userTokens);

        res.json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const logout = async (req, res) => {
    try {
        const userId = req.user.id;

        // TODO: replace with database query
        refreshTokenStore.delete(userId);

        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token is required" });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }

        // TODO: replace with database query
        const userTokens = refreshTokenStore.get(decoded.id) || [];
        if (!userTokens.includes(refreshToken)) {
            return res.status(401).json({ error: "Refresh token not found" });
        }

        const userPayload = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
        };
        const newAccessToken = generateAccessToken(userPayload);

        res.json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // TODO: replace with database query
        const user = USERS.find((u) => u.email === email);

        if (!user) {
            return res.json({
                message: "If the email exists, a password reset link has been sent",
            });
        }

        const resetToken = generatePasswordResetToken({
            userId: user.id,
            email: user.email,
            password: user.password,
        });

        // TODO: replace with database query
        passwordResetTokenStore.set(user.id, {
            token: resetToken,
            createdAt: new Date(),
        });

        // TODO: send an email here
        console.log(`Password reset token for ${email}: ${resetToken}`);
        res.json({
            message: "If the email exists, a password reset link has been sent",
            resetToken: resetToken, // TODO: remove, this is for testing
        });
    } catch (error) {
        console.error("Password reset request error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: "Token and new password are required" });
        }

        // TODO: replace with real validation
        if (newPassword.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long" });
        }

        let userId = null;
        let storedTokenData = null;

        // TODO: replace with database query
        for (const [id, tokenData] of passwordResetTokenStore.entries()) {
            if (tokenData.token === token) {
                userId = id;
                storedTokenData = tokenData;
                break;
            }
        }

        if (!userId || !storedTokenData) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }

        // TODO: replace with database query
        const user = USERS.find((u) => u.id === userId);
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        try {
            verifyPasswordResetToken(token, user.password);
        } catch (error) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }

        const hashedPassword = await hashPassword(newPassword);

        // TODO: replace with database query
        const userIndex = USERS.findIndex((u) => u.id === userId);
        if (userIndex !== -1) {
            USERS[userIndex].password = hashedPassword;
        }
        passwordResetTokenStore.delete(userId);
        refreshTokenStore.delete(userId);
        res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    login,
    logout,
    refreshToken,
    requestPasswordReset,
    resetPassword,
};
