/**
 * Utility to map Supabase auth errors to user-friendly messages.
 */

export interface FriendlyError {
    title: string;
    message: string;
    type: 'error' | 'success' | 'info';
}

export function getFriendlyAuthError(error: any): FriendlyError {
    const code = error?.code || '';
    const msg = error?.message || '';

    // Default error state
    let result: FriendlyError = {
        title: 'Authentication Error',
        message: msg || 'An unexpected error occurred. Please try again.',
        type: 'error'
    };

    // 1. Map by Supabase Error Code (Most reliable)
    switch (code) {
        case 'invalid_credentials':
            return {
                title: 'Login Failed',
                message: "Incorrect email or password. If you haven't registered yet, please create an account first.",
                type: 'error'
            };
        case 'user_not_found':
            return {
                title: 'Account Not Found',
                message: "We couldn't find an account with that email. Please check the spelling or register a new account.",
                type: 'error'
            };
        case 'email_not_confirmed':
            return {
                title: 'Email Not Verified',
                message: 'Please verify your email address before signing in. Check your inbox for the verification code.',
                type: 'info'
            };
        case 'too_many_requests':
            return {
                title: 'Too Many Attempts',
                message: 'For your security, we have temporarily restricted login attempts. Please wait a few minutes and try again.',
                type: 'error'
            };
        case 'network_error':
            return {
                title: 'Network Timeout',
                message: 'Unable to connect to the server. Please check your internet connection and try again.',
                type: 'error'
            };
        case 'weak_password':
            return {
                title: 'Weak Password',
                message: 'Your password is too simple. Please use at least 6 characters with a mix of letters and numbers.',
                type: 'error'
            };
        case 'user_already_exists':
            return {
                title: 'Already Registered',
                message: 'An account with this email already exists. Try signing in instead.',
                type: 'info'
            };
    }

    // 2. Fallback to Message Matching (If code is missing)
    const lowerMsg = msg.toLowerCase();

    if (lowerMsg.includes('invalid login credentials')) {
        return {
            title: 'Incorrect Credentials',
            message: 'Wrong email or password. If you forgot your password, use the reset link below.',
            type: 'error'
        };
    }

    if (lowerMsg.includes('email not confirmed') || lowerMsg.includes('not confirmed')) {
        return {
            title: 'Verify Your Email',
            message: 'Your account is almost ready! Please check your email for the verification code to confirm.',
            type: 'info'
        };
    }

    if (lowerMsg.includes('rate limit')) {
        return {
            title: 'Slow Down',
            message: 'You are making requests too quickly. Please wait a moment.',
            type: 'error'
        };
    }

    return result;
}
