import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = path.resolve(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const createLogger = (filename) => {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: path.join(logDir, `${filename}.log`) })
    ]
  });

  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }));
  }

  return logger;
};

export const authLogger = createLogger('auth');
export const socketLogger = createLogger('socket');
export const apiLogger = createLogger('api');
export const errorLogger = createLogger('error');
export const dbLogger = createLogger('database');

export default createLogger('combined');
