import app from './app';
import { logger } from './utils/logger';
import { PORT } from './utils/constants';

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
