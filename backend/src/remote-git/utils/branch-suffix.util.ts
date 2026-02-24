/**
 * Generate a 6-character random suffix (lowercase letters + numbers)
 * This is used for branch naming to avoid conflicts when multiple users
 * work on the same remote issue.
 */
export function generateBranchSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
