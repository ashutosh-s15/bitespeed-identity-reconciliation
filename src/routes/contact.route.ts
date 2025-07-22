import { Router } from 'express';
import ContactController from '../controllers/contact.controller';
import { validateIdentifyRequest } from '../middleware/validation.middleware';

class ContactRoute {
  public router = Router();
  public contactController = new ContactController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      '/identify',
      validateIdentifyRequest,
      this.contactController.identify
    );
  }
}

export default ContactRoute;
