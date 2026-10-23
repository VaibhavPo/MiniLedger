// Generates a random 6-digit numeric OTP
export function generateOtp(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

// Mock OTP sender: logs OTP prominently in server logs
export function logMockOtp(identifier: string, otp: string, purpose: string = 'Authentication'): void {
  const border = '==================================================';
  console.log('\n' + border);
  console.log(`[MOCK OTP SERVICE] - ${purpose.toUpperCase()}`);
  console.log(`Target Recipient : ${identifier}`);
  console.log(`Your OTP Code    : ${otp}`);
  console.log(`Expiration       : Valid for 5 minutes`);
  console.log(border + '\n');
}
