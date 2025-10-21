import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    ConfirmSignUpCommand,
    InitiateAuthCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    ChangePasswordCommand,
    AuthFlowType,
    SignUpCommandOutput,
    ConfirmSignUpCommandOutput,
    InitiateAuthCommandOutput,
    ForgotPasswordCommandOutput,
    ConfirmForgotPasswordCommandOutput,
    ChangePasswordCommandOutput
} from '@aws-sdk/client-cognito-identity-provider';
import { 
    SignUpRequest, 
    LoginRequest, 
    ConfirmSignUpRequest,
    ForgotPasswordRequest,
    ConfirmForgotPasswordRequest,
    ChangePasswordRequest
} from '../models/User.js';
import { calculateSecretHash } from '../utils/cognitoUtils.js';

export class AuthRepository {
    private cognitoClient: CognitoIdentityProviderClient;
    private userPoolId: string;
    private clientId: string;

    constructor() {
        this.cognitoClient = new CognitoIdentityProviderClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        this.userPoolId = process.env.COGNITO_USER_POOL_ID!;
        this.clientId = process.env.COGNITO_CLIENT_ID!;
    }

    async signUp(signUpRequest: SignUpRequest): Promise<SignUpCommandOutput> {
        const userAttributes = [
            {
                Name: 'email',
                Value: signUpRequest.email,
            },
        ];

        if (signUpRequest.name) {
            userAttributes.push({
                Name: 'name',
                Value: signUpRequest.name,
            });
        }

        if (signUpRequest.lastName) {
            userAttributes.push({
                Name: 'family_name',
                Value: signUpRequest.lastName,
            });
        }

        const command = new SignUpCommand({
            ClientId: this.clientId,
            Username: signUpRequest.email,
            Password: signUpRequest.password,
            SecretHash: calculateSecretHash(signUpRequest.email),
            UserAttributes: userAttributes,
        });

        return await this.cognitoClient.send(command);
    }

    async confirmSignUp(confirmRequest: ConfirmSignUpRequest): Promise<ConfirmSignUpCommandOutput> {
        const command = new ConfirmSignUpCommand({
            ClientId: this.clientId,
            Username: confirmRequest.email,
            ConfirmationCode: confirmRequest.confirmationCode,
            SecretHash: calculateSecretHash(confirmRequest.email),
        });

        return await this.cognitoClient.send(command);
    }

    async login(loginRequest: LoginRequest): Promise<InitiateAuthCommandOutput> {
        const command = new InitiateAuthCommand({
            ClientId: this.clientId,
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            AuthParameters: {
                USERNAME: loginRequest.email,
                PASSWORD: loginRequest.password,
                SECRET_HASH: calculateSecretHash(loginRequest.email),
            },
        });

        return await this.cognitoClient.send(command);
    }

    async forgotPassword(forgotPasswordRequest: ForgotPasswordRequest): Promise<ForgotPasswordCommandOutput> {
        const command = new ForgotPasswordCommand({
            ClientId: this.clientId,
            Username: forgotPasswordRequest.email,
            SecretHash: calculateSecretHash(forgotPasswordRequest.email),
        });

        return await this.cognitoClient.send(command);
    }

    async confirmForgotPassword(confirmRequest: ConfirmForgotPasswordRequest): Promise<ConfirmForgotPasswordCommandOutput> {
        const command = new ConfirmForgotPasswordCommand({
            ClientId: this.clientId,
            Username: confirmRequest.email,
            ConfirmationCode: confirmRequest.confirmationCode,
            Password: confirmRequest.newPassword,
            SecretHash: calculateSecretHash(confirmRequest.email),
        });

        return await this.cognitoClient.send(command);
    }

    async changePassword(changePasswordRequest: ChangePasswordRequest): Promise<ChangePasswordCommandOutput> {
        const command = new ChangePasswordCommand({
            AccessToken: changePasswordRequest.accessToken,
            PreviousPassword: changePasswordRequest.oldPassword,
            ProposedPassword: changePasswordRequest.newPassword,
        });

        return await this.cognitoClient.send(command);
    }
}
