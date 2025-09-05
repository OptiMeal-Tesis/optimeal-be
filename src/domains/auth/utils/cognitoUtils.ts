import crypto from 'crypto';

export function calculateSecretHash(username: string): string {
    const clientId = process.env.COGNITO_CLIENT_ID!;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET!;

    if (!clientSecret) {
        throw new Error('COGNITO_CLIENT_SECRET no está configurado');
    }

    const message = username + clientId;
    const hmac = crypto.createHmac('sha256', clientSecret);
    hmac.update(message);
    return hmac.digest('base64');
}
