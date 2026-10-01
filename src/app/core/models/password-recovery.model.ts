export interface PasswordRecoveryRequest {
  phoneNumber: string;
}

export interface PasswordRecoveryResponse {
  verificationId: string | null;
}

export interface VerifyPasswordRecoveryRequest {
  phoneNumber: string;
  verificationId: string;
  otpCode: string;
  newPassword: string;
}
