import { ky } from "@/lib/ky-auth";
import type { SignInResponse } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";

const signIn = async (email: string, password: string): Promise<SignInResponse> =>
    await ky
        .post("auth/sign-in", {
            json: {
                email,
                password,
            },
        })
        .json<SignInResponse>();

export const useSignIn = () =>
    useMutation<SignInResponse, Error, { email: string; password: string }>({
        mutationFn: ({ email, password }) => signIn(email, password),
    });

// Commenting out resetPassword and forgotPassword, don't know how to properly implement them

const resetPassword = async (
    newPassword: string,
    confirmPassword: string,
    token: string
): Promise<SignInResponse> =>
    await ky
        .post("auth/reset-password", {
            json: {
                newPassword,
                confirmPassword,
                token,
            },
        })
        .json<SignInResponse>();

export const useResetPassword = () =>
    useMutation<
        SignInResponse,
        Error,
        { newPassword: string; confirmPassword: string; token: string }
    >({
        mutationFn: ({ newPassword, confirmPassword, token }) =>
            resetPassword(newPassword, confirmPassword, token),
    });

// const forgotPassword = async (email: string): Promise<{ message: string }> =>
//     await ky
//         .post("auth/request-password-reset", {
//             json: {
//                 email,
//             },
//         })
//         .json<{ message: string }>();
