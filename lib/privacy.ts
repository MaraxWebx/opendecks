export const CURRENT_PRIVACY_POLICY_VERSION = "2026-04-14";

export function buildPrivacyConsentRecord() {
  return {
    privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
    privacyAcceptedAt: new Date().toISOString(),
  };
}
