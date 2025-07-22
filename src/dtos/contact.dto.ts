import { Contact, ContactResponse } from '../interfaces/contact.interface';

export class ContactResponseDto implements ContactResponse {
  constructor(
    public primaryContactId: number,
    public emails: string[],
    public phoneNumbers: string[],
    public secondaryContactIds: number[]
  ) {}

  static fromContacts(
    primaryContact: Contact,
    secondaryContacts: Contact[]
  ): ContactResponseDto {
    const emails = [primaryContact.email];
    const phoneNumbers = [primaryContact.phoneNumber];
    const secondaryContactIds: number[] = [];

    for (const contact of secondaryContacts) {
      if (contact.email && !emails.includes(contact.email)) {
        emails.push(contact.email);
      }
      if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) {
        phoneNumbers.push(contact.phoneNumber);
      }
      secondaryContactIds.push(contact.id);
    }

    return new ContactResponseDto(
      primaryContact.id,
      emails.filter((e): e is string => e !== null),
      phoneNumbers.filter((p): p is string => p !== null),
      secondaryContactIds
    );
  }
}
