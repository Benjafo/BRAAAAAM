const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

const hashPassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        return hashedPassword;
    } catch (error) {
        throw new Error("Error hashing password");
    }
};

const comparePassword = async (plainPassword, hashedPassword) => {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        throw new Error("Error comparing passwords");
    }
};

module.exports = {
    hashPassword,
    comparePassword,
};
