import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import ContactRoute from './routes/contact.route';
import logger from './utils/logger';
import errorMiddleware from './middleware/error.middleware';

class App {
  public app: express.Application;
  public contactRoute = new ContactRoute();

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  public listen() {
    const port = process.env.PORT || 3000;
    this.app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }

  private initializeMiddlewares() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      morgan('combined', {
        stream: { write: message => logger.info(message.trim()) },
      })
    );
  }

  private initializeRoutes() {
    this.app.use('/', this.contactRoute.router);
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default App;
