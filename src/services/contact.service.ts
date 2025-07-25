import {
  Contact,
  ContactResponse,
  IdentifyRequest,
} from '../interfaces/contact.interface';
import { ContactResponseDto } from '../dtos/contact.dto';
import ContactModel from '../models/contact.model';
import logger from '../utils/logger';

class ContactService {
  private contactModel = new ContactModel();

  public async identify(request: IdentifyRequest): Promise<ContactResponseDto> {
    const { email, phoneNumber } = request;

    // Validate at least one contact info is provided
    if (!email && !phoneNumber) {
      throw new Error('Either email or phoneNumber must be provided');
    }

    // Find all contacts matching the email or phoneNumber
    const existingContacts = await this.contactModel.findByEmailOrPhone(
      email,
      phoneNumber
    );

    logger.info(
      `[ContactController][identify] Existing contact found: ${existingContacts}`
    );

    if (existingContacts.length === 0) {
      logger.info(
        `[ContactController][identify] No existing contacts found for: ${request.email} and ${request.phoneNumber}`
      );
      // No existing contacts, create a new primary contact
      const newContact = await this.contactModel.create({
        phoneNumber: phoneNumber || null,
        email: email || null,
        linkedId: null,
        linkPrecedence: 'primary',
      });

      logger.info(
        `[ContactController][identify] New contact created: ${newContact}`
      );

      return new ContactResponseDto(
        newContact.id,
        newContact.email ? [newContact.email] : [],
        newContact.phoneNumber ? [newContact.phoneNumber] : [],
        []
      );
    }

    // Find the oldest primary contact (or the primary contact of the oldest contact)
    const primaryContact = await this.findPrimaryContact(existingContacts);
    const allLinkedContacts = await this.contactModel.findLinkedContacts(
      primaryContact.id
    );

    // Check if we need to create a new secondary contact
    const hasNewInfo = this.hasNewContactInfo(
      allLinkedContacts,
      email,
      phoneNumber
    );
    if (hasNewInfo) {
      await this.handleNewContactInfo(
        primaryContact,
        email,
        phoneNumber,
        allLinkedContacts
      );
      // Refresh the linked contacts after potential updates
      const updatedLinkedContacts = await this.contactModel.findLinkedContacts(
        primaryContact.id
      );
      return ContactResponseDto.fromContacts(
        primaryContact,
        updatedLinkedContacts.filter(c => c.id !== primaryContact.id)
      );
    }

    return ContactResponseDto.fromContacts(
      primaryContact,
      allLinkedContacts.filter(c => c.id !== primaryContact.id)
    );
  }

  private async findPrimaryContact(contacts: Contact[]): Promise<Contact> {
    // Find all primary contacts in the list
    const primaryContacts = contacts.filter(
      c => c.linkPrecedence === 'primary'
    );

    // If there's only one primary contact, return it
    if (primaryContacts.length === 1) {
      return primaryContacts[0];
    }

    // If multiple primary contacts, find the oldest one
    if (primaryContacts.length > 1) {
      const oldestPrimary = primaryContacts.reduce((oldest, current) =>
        current.createdAt < oldest.createdAt ? current : oldest
      );

      // Convert other primary contacts to secondary
      await this.convertToSecondary(primaryContacts, oldestPrimary.id);
      return oldestPrimary;
    }

    // If no primary contacts in the list (all are secondary), find their primary contacts
    const primaryContactIds = new Set<number>();
    for (const contact of contacts) {
      if (contact.linkedId) {
        const primaryContact = await this.contactModel.findById(
          contact.linkedId
        );
        if (primaryContact) {
          primaryContactIds.add(primaryContact.id);
        }
      }
    }

    if (primaryContactIds.size === 1) {
      return this.contactModel.findById(Array.from(primaryContactIds)[0]);
    }

    // Multiple primary contacts linked to the secondaries
    // Find the oldest primary contact among them
    const primaryContactsList = await Promise.all(
      Array.from(primaryContactIds).map(id => this.contactModel.findById(id))
    );

    const oldestPrimary = primaryContactsList.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    );

    // Convert other primary contacts to secondary
    await this.convertToSecondary(primaryContactsList, oldestPrimary.id);
    return oldestPrimary;
  }

  private async convertToSecondary(
    contacts: Contact[],
    primaryId: number
  ): Promise<void> {
    const updates = contacts
      .filter(c => c.id !== primaryId && c.linkPrecedence === 'primary')
      .map(c =>
        this.contactModel.update(c.id, {
          linkedId: primaryId,
          linkPrecedence: 'secondary',
        })
      );

    await Promise.all(updates);
  }

  private hasNewContactInfo(
    contacts: Contact[],
    email?: string,
    phoneNumber?: string
  ): boolean {
    if (email && !contacts.some(c => c.email === email)) return true;
    if (phoneNumber && !contacts.some(c => c.phoneNumber === phoneNumber))
      return true;
    return false;
  }

  private async handleNewContactInfo(
    primaryContact: Contact,
    email?: string,
    phoneNumber?: string,
    existingContacts?: Contact[]
  ): Promise<void> {
    const contacts =
      existingContacts ||
      (await this.contactModel.findLinkedContacts(primaryContact.id));

    // Check if the new info already exists in any of the linked contacts
    const emailExists = email ? contacts.some(c => c.email === email) : false;
    const phoneExists = phoneNumber
      ? contacts.some(c => c.phoneNumber === phoneNumber)
      : false;

    // If both pieces of info already exist in the linked contacts, no need to create a new contact
    if ((!email || emailExists) && (!phoneNumber || phoneExists)) {
      return;
    }

    // Create a new secondary contact with the new info
    await this.contactModel.create({
      phoneNumber: phoneExists ? null : phoneNumber,
      email: emailExists ? null : email,
      linkedId: primaryContact.id,
      linkPrecedence: 'secondary',
    });
  }
}

export default ContactService;
