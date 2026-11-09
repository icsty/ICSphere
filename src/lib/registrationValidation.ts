// Pure validation rules shared by registration UI and future server handlers.
export const RTU_STUDENT_NUMBER_PATTERN = /^202\d-\d{6}$/
export const RTU_STUDENT_EMAIL_PATTERN = /^202\d-\d{6}@rtu\.edu\.ph$/
export const RTU_PROGRAM_CODE = 'BSINFOTECH'
export const RTU_PROGRAM_NAME = 'Bachelor of Science in Information Technology'

export type FieldValidation = { value: string; error: string | null }

export function validateInstitutionalEmail(input: unknown): FieldValidation {
  const value = typeof input === 'string' ? input.trim().toLowerCase() : ''
  return {
    value,
    error: RTU_STUDENT_EMAIL_PATTERN.test(value)
      ? null
      : 'Use your RTU student email in the format 202X-XXXXXX@rtu.edu.ph, with digits in place of X.',
  }
}

export function validateStudentName(input: unknown): FieldValidation {
  const value = typeof input === 'string' ? input.normalize('NFC').replace(/\p{Zs}+/gu, ' ').trim() : ''
  if (!value) return { value, error: 'Enter your full name as shown on your registration form.' }
  if (value.length > 150) return { value, error: 'Keep your full name within 150 characters.' }
  // Keep accents, surname commas, initials, apostrophes, and hyphenated names.
  if (!/\p{L}/u.test(value) || !/^[\p{L}\p{M} .,'’\-\u2010\u2011]+$/u.test(value)) {
    return { value, error: 'Use letters, spaces, commas, periods, apostrophes, or hyphens for your name.' }
  }
  return { value, error: null }
}

export function validateStudentNumber(input: unknown, institutionalEmail?: unknown): FieldValidation {
  const value = typeof input === 'string' ? input.trim() : ''
  if (!RTU_STUDENT_NUMBER_PATTERN.test(value)) {
    return { value, error: 'Use the format 202X-XXXXXX, with digits in place of X.' }
  }
  if (institutionalEmail !== undefined) {
    const email = validateInstitutionalEmail(institutionalEmail)
    if (email.error) return { value, error: 'Sign in with your official RTU student email first.' }
    if (email.value.split('@')[0] !== value) {
      return { value, error: 'Your student number must match the number in your RTU email.' }
    }
  }
  return { value, error: null }
}
