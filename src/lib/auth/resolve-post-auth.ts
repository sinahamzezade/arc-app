import { systemFlagsApi } from "@/lib/api/system-flags";
import {
  resolvePostAuthPath,
  type PostAuthInput,
} from "@/lib/auth/post-auth-route";

/** Resolve post-auth destination, respecting OTP flag (user override when token given). */
export async function resolvePostAuthPathWithFlags(
  input: Omit<PostAuthInput, "otpVerificationEnabled"> & {
    accessToken?: string | null;
  },
): Promise<string> {
  let otpVerificationEnabled = true;
  try {
    const flags = input.accessToken
      ? await systemFlagsApi.getMine(input.accessToken)
      : await systemFlagsApi.getPublic();
    otpVerificationEnabled = flags.otp_verification_enabled !== false;
  } catch {
    /* fail open to verify gate */
  }
  return resolvePostAuthPath({ ...input, otpVerificationEnabled });
}
