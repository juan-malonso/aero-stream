/**
 * @enum {string}
 * @description Defines the available log levels.
 */
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

/**
 * @interface LogEntry
 * @description Defines the structure of a log entry.
 */
interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: string;
    message: string;
    context?: any;
}

/**
 * @description A simple JSON logger with multiple log levels.
 */
export class Logger {
    private category: string;

    constructor(category: string) {
        this.category = category;
    }

    /**
     * The core logging function.
     * @param {LogLevel} level - The level of the log entry.
     * @param {string} message - The main log message.
     * @param {any} [context] - Optional context to include in the log.
     */
    private log(level: LogLevel, message: string, context?: any) {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            category: this.category,
            message,
        };

        if (context) {
            // Ensure errors are serialized properly
            if (context.error instanceof Error) {
                logEntry.context = { 
                    ...context,
                    error: { 
                        message: context.error.message, 
                        stack: context.error.stack 
                    } 
                };
            } else {
                logEntry.context = context;
            }
        }

        console.log(JSON.stringify(logEntry)); // Using indentation for readability
    }

    /**
     * Logs a debug message.
     * @param {string} message - The main log message.
     * @param {any} [context] - Optional context to include in the log.
     */
    debug(message: string, context?: any) {
        this.log(LogLevel.DEBUG, message, context);
    }
    
    /**
     * Logs an info message.
     * @param {string} message - The main log message.
     * @param {any} [context] - Optional context to include in the log.
     */
    info(message: string, context?: any) {
        this.log(LogLevel.INFO, message, context);
    }

    /**
     * Logs a warning message.
     * @param {string} message - The main log message.
     * @param {any} [context] - Optional context to include in the log.
     */
    warn(message: string, context?: any) {
        this.log(LogLevel.WARN, message, context);
    }

    /**
     * Logs an error message.
     * @param {string} message - The main log message.
     * @param {any} [context] - Optional context to include in the log.
     */
    error(message: string, context?: any) {
        this.log(LogLevel.ERROR, message, context);
    }
}
