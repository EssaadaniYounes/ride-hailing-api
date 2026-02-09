import winston from 'winston';
import 'winston-daily-rotate-file';
import { config } from '../config/env';
import { ElasticsearchTransport } from "winston-elasticsearch";
const { format } = winston;
const { combine, timestamp, label, printf } = format;


const esTransport = config.elasticsearch.enableElasticSearch ? new ElasticsearchTransport({
  level: "info",
  clientOpts: {
    node: config.elasticsearch.url,
  },
  indexPrefix: "api-logs",
}) : null;

const transport = new winston.transports.DailyRotateFile({
  filename: 'logs/log-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const myFormat = printf(({ level, message, label, timestamp, ...meta }: winston.Logform.TransformableInfo) => {
  return `${timestamp} [${label}] ${level}: ${message} ${JSON.stringify(meta || {})}`;
});

const logger = winston.createLogger({
  format: combine(
    winston.format.json(),
    label({ label: 'API Service' }),
    timestamp(),
    myFormat
  ),
  transports: [
    transport,
    ...(config.elasticsearch.enableElasticSearch && esTransport ? [esTransport] : [])
  ]
});

if (config.server.nodeEnv === 'development') {
  logger.add(new winston.transports.Console());
}


export default logger;