export const addressInputMessages = {
  requiredIndicator: '*',
  defaultLabel: 'Mailing address',
  streetLabel: 'Street address',
  street2Label: 'Apartment, suite, etc. (optional)',
  cityLabel: 'City',
  regionLabel: 'State / Province / Region',
  postalCodeLabel: 'Postal code',
  countryLabel: 'Country',
  incompleteAddress: 'Please complete street, city, postal code, and country.',
} as const satisfies Record<string, string>;
