import { ky } from "@/lib/ky-auth";
import type { LoginResponse } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";

const signIn = async (email: string, password: string): Promise<LoginResponse> =>
    await ky
        .post("auth/sign-in", {
            json: {
                email,
                password,
            },
        })
        .json<LoginResponse>();

export const useSignIn = () =>
    useMutation<LoginResponse, Error, { email: string; password: string }>({
        mutationFn: ({ email, password }) => signIn(email, password),
    });

const resetPassword = async (
    newPassword: string,
    confirmPassword: string,
    token: string
): Promise<LoginResponse> =>
    await ky
        .post("auth/reset-password", {
            json: {
                newPassword,
                confirmPassword,
                token,
            },
        })
        .json<LoginResponse>();

export const useResetPassword = () =>
    useMutation<
        LoginResponse,
        Error,
        { newPassword: string; confirmPassword: string; token: string }
    >({
        mutationFn: ({ newPassword, confirmPassword, token }) =>
            resetPassword(newPassword, confirmPassword, token),
    });

const forgotPassword = async (email: string): Promise<{ message: string }> =>
    await ky
        .post("auth/request-password-reset", {
            json: {
                email,
            },
        })
        .json<{ message: string }>();

export const useForgotPassword = () =>
    useMutation<{ message: string }, Error, { email: string }>({
        mutationFn: ({ email }) => forgotPassword(email),
    });
