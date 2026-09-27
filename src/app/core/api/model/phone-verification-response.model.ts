export interface PhoneVerificationResponse {
  userId: number;
  verified: boolean;
}

export interface ResendPhoneVerificationResponse {
  verificationId: string;
}
