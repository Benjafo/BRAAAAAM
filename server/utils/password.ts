import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        return hashedPassword;
    } catch (_error) {
        throw new Error("Error hashing password");
    }
};

export const comparePassword = async (
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> => {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch (_error) {
        throw new Error("Error comparing passwords");
    }
};
