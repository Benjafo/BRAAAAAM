import { requestPasswordResetSchema, signInSchema, createPasswordSchema } from "../schemas/auth.schema.js";
import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { comparePassword, hashPassword } from "../utils/password.js";
import { generateAccessToken, generatePasswordResetToken, generateRefreshToken, verifyPasswordResetToken, verifyRefreshToken } from "../utils/jwt.js";
import { TokenPayload } from "../types/auth.types.js";
import { getSysDb } from "../drizzle/sys-client.js";
import { users } from "../drizzle/sys/schema.js";

const signIn = async (req: Request, res: Response) => {

    try {

        const parsed = signInSchema.safeParse(req.body);

        if(!parsed.success) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const { email, password } = parsed.data; 

        const db = getSysDb()

        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isValidPassword = await comparePassword(
            password, 
            user.passwordHash ?? ''
        );

        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const tokenPayload: TokenPayload = {
            id: user.id,
            email: user.email,
            db: 'sys' /**@TODO make dynamic, possibly with with-sys middleware */
        }

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        res.cookie('refresh-token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const { passwordHash, ...userResponse } = user

        return res.json({
            message: "Signed in successfully",
            accessToken,
            user: userResponse,
        });


    } catch (error) {

        console.error("signIn error:", error);
        return res.status(500).json({error: "Internal server error"});
    }
    
}

const signOut = async (req: Request, res: Response) => {
    try {
        if( !req.user ) {
            return res.status(401).json({ error: 'Unauthorized'});
        }

        res.clearCookie('refresh-token');
        
        return res.json({
            message: 'Signed out successfully'
        })
    } catch (error) {

        console.error("signOut error:", error);
        return res.status(500).json({
            error: "Internal server error"
        })
    }
}

const refreshToken = async (req: Request, res: Response) => {
    try {

        const refreshToken = req.cookies['refresh-token'];

        if (!refreshToken) {
            return res.status(400).json({
                error: "Refresh token is required"
            });
        }

        let decoded: TokenPayload;
        try {
            decoded = verifyRefreshToken(refreshToken)
        } catch {
            return res.status(401).json({
                error: "Invalid or expired refresh token"
            });
        }

        const tokenPayload: TokenPayload = {...decoded}
        const accessToken = generateAccessToken(tokenPayload);

        return res.json({
            message: "Token refreshed successfully",
            accessToken
        })

    } catch (error) {
        console.error("refreshToken error:", error);
        return res.status(500).json({
            error: "Internal server error"
        })
    }
}

const requestPasswordReset = async (req: Request, res: Response) => {

    try {

        const parsed = requestPasswordResetSchema.safeParse(req.body);

        if(!parsed.success) {
            return res.status(400).json({
                error: "Invalid email"
            });
        }

        const { email } = parsed.data;

        const db = getSysDb();

        const user = await db.query.users.findFirst({
            columns: {
                id: true,
                email: true,
                passwordHash: true,
            },
            where: eq(users.email, email)
        });

        if(!user) {
            return res.json({
                message: "If the email exists, a password reset link has been sent"
            })
        }

        const resetToken = generatePasswordResetToken({
            userId: user.id,
            email: user.email,
            password: user.passwordHash ?? ''
        });

        /**
         * @TODO handle email integration for sending password reset.
         * Link needs to send reset token and userId as query params
         * to the found email address.
         */

        console.log('requestResetPassword link:', `?token=${resetToken}&id=${user.id}`)

        return res.json({
            message: "If the email exists, a password reset link has been sent"
        });

    } catch (error) {

        console.error("requestPasswordReset error:", error);
        return res.status(500).json({
            error: "Internal server error"
        })
    }
}

const resetPassword = async (req: Request, res: Response) => {
    
    try {

        const token = req.query['token'] as string;
        const userId = req.query['userId'] as string;

        if (!token || !userId) {
            return res.status(400).json({
                error: "Bad request"
            })
        }

        let decoded: {userPassword: string, email: string};
        try {
            decoded = verifyPasswordResetToken(token, userId)
        } catch {
            return res.status(401).json({
                error: "invalid or expired password reset token"
            });
        }

        const parsed = createPasswordSchema.safeParse(req.body);
        
        if(!parsed.success) {
            return res.status(400).json({
                error: "Failed password reset validation",
                details: parsed.error.issues
            });
        }

        const { newPassword } = parsed.data;

        const newHashPassword = await hashPassword(newPassword);

        if(newHashPassword === decoded.userPassword) {
            return res.status(400).json({
                error: "Password cannot match an existing password"
            });
        }

        const db = getSysDb()

        await db
            .update(users)
            .set({ passwordHash: newHashPassword })
            .where(eq(users.id, userId));

        /**
         * @TODO Send email to user that password reset has
         * been successful.
         */        

        return res.json({
            message: "Reset password successfully"
        });

    } catch (error) {

        console.error("resetPassword error:", error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

export default {
    signIn,
    signOut,
    refreshToken,
    requestPasswordReset,
    resetPassword,
}