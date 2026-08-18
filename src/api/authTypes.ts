/** Mirrors Meridian.Application.DTOs.LoginResult exactly. When
 * requiresOtpVerification is true, token/expiresAtUtc are null — the
 * frontend must show the OTP-and-change-password screen next rather than
 * treating this as a completed login. */
export interface LoginResult {
  requiresOtpVerification: boolean;
  token: string | null;
  expiresAtUtc: string | null;
  employeeCode: string;
  fullName: string;
}