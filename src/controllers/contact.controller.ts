import { NextFunction, Request, Response } from 'express';
import { IdentifyRequest } from '../interfaces/contact.interface';
import ContactService from '../services/contact.service';
import { ContactResponseDto } from '../dtos/contact.dto';
import logger from '../utils/logger';

class ContactController {
  private contactService = new ContactService();

  public identify = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const request: IdentifyRequest = {
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
      };

      const response = await this.contactService.identify(request);

      res.status(200).json({
        contact: response,
      });
    } catch (error: any) {
      logger.error(`[ContactController][identify]: ${error.message}`);
      next(error);
    }
  };
}

export default ContactController;
