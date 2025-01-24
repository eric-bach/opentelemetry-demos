import { CustomLogFW } from './logger';
import * as logging from 'logging';

// Initialize the CustomLogFW with service name and instance ID.
const logFW = new CustomLogFW('plant_service', '1');
const handler = logFW.setupLogging();

// Add the handler to the global logger.
logging.getLogger().addHandler(handler);

// Log an error message.
logging.error('What a nasty bug! It flew into the plant service and stopped adding plants.');
