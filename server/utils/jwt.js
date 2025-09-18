const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_TOKEN_SECRET =
    process.env.ACCESS_TOKEN_SECRET || crypto.randomBytes(64).toString("hex");
const REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || crypto.randomBytes(64).toString("hex");
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const PASSWORD_RESET_TOKEN_EXPIRY = "1h";

const generateAccessToken = (payload) => {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

const generatePasswordResetToken = (payload) => {
    const resetTokenSecret = ACCESS_TOKEN_SECRET + payload.password;
    return jwt.sign({ userId: payload.userId, email: payload.email }, resetTokenSecret, {
        expiresIn: PASSWORD_RESET_TOKEN_EXPIRY,
    });
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new Error("Invalid or expired access token");
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new Error("Invalid or expired refresh token");
    }
};

const verifyPasswordResetToken = (token, userPassword) => {
    try {
        const resetTokenSecret = ACCESS_TOKEN_SECRET + userPassword;
        return jwt.verify(token, resetTokenSecret);
    } catch (error) {
        throw new Error("Invalid or expired password reset token");
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generatePasswordResetToken,
    verifyAccessToken,
    verifyRefreshToken,
    verifyPasswordResetToken,
};
