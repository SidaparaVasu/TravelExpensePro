import * as z from 'zod';

// Common validation patterns
export const ValidationPatterns = {
  // Alphanumeric with spaces, hyphens, and underscores
  name: /^[a-zA-Z0-9\s\-_]+$/,
  // Alphanumeric code (no spaces)
  code: /^[a-zA-Z0-9\-_]+$/,
  // Phone number (various formats)
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  // Postal code (flexible)
  postalCode: /^[a-zA-Z0-9\s\-]{3,10}$/,
};

// Common validation schemas
export const CommonValidations = {
  requiredString: (fieldName: string, minLength = 1, maxLength = 255) =>
    z.string()
      .min(minLength, `${fieldName} is required`)
      .max(maxLength, `${fieldName} must be less than ${maxLength} characters`),

  optionalString: (maxLength = 255) =>
    z.string()
      .max(maxLength, `Must be less than ${maxLength} characters`)
      .optional()
      .or(z.literal('')),

  requiredCode: (fieldName: string, minLength = 2, maxLength = 20) =>
    z.string()
      .min(minLength, `${fieldName} is required`)
      .max(maxLength, `${fieldName} must be less than ${maxLength} characters`)
      .regex(ValidationPatterns.code, `${fieldName} can only contain letters, numbers, hyphens, and underscores`),

  requiredName: (fieldName: string, minLength = 2, maxLength = 100) =>
    z.string()
      .min(minLength, `${fieldName} is required`)
      .max(maxLength, `${fieldName} must be less than ${maxLength} characters`)
      .regex(ValidationPatterns.name, `${fieldName} contains invalid characters`),

  email: z.string().email('Please enter a valid email address'),

  phone: z.string()
    .regex(ValidationPatterns.phone, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),

  postalCode: z.string()
    .regex(ValidationPatterns.postalCode, 'Please enter a valid postal code')
    .optional()
    .or(z.literal('')),

  positiveNumber: (fieldName: string, min = 0, max?: number) => {
    let schema = z.coerce.number().min(min, `${fieldName} must be at least ${min}`);
    if (max !== undefined) {
      schema = schema.max(max, `${fieldName} must be at most ${max}`);
    }
    return schema;
  },
};

// Organization-specific validations
export const OrganizationValidations = {
  department: {
    dept_name: CommonValidations.requiredName('Department name', 2, 100),
    dept_code: CommonValidations.requiredCode('Department code', 2, 20),
    description: CommonValidations.optionalString(500),
  },

  designation: {
    designation_name: CommonValidations.requiredName('Designation name', 2, 100),
    designation_code: CommonValidations.requiredCode('Designation code', 2, 20),
    description: CommonValidations.optionalString(500),
  },

  employeeType: {
    type: CommonValidations.requiredName('Employee type', 2, 50),
    description: CommonValidations.optionalString(500),
  },

  company: {
    name: CommonValidations.requiredName('Company name', 2, 200),
    address: CommonValidations.requiredString('Address', 5, 500),
    pincode: CommonValidations.postalCode,
    phone: CommonValidations.phone,
    email: CommonValidations.email.optional().or(z.literal('')),
  },
};