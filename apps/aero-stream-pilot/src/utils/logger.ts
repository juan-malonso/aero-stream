/**
 * @enum {string}
 * @description Defines the available log levels.
 */
export enum LogLevel {
    debug = 'DEBUG',
    info = 'INFO',
    warn = 'WARN',
    error = 'ERROR',
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
    context?: unknown;
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
     * @param {unknown} [context] - Optional context to include in the log.
     */
    private log(level: LogLevel, message: string, context?: unknown) {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            category: this.category,
            message,
        };

        if (context) {
            if (typeof context === 'object') {
                const ctx = context as Record<string, unknown>;
                if (ctx.error instanceof Error) {
                    logEntry.context = { 
                        ...ctx,
                        error: { 
                            message: ctx.error.message, 
                            stack: ctx.error.stack 
                        } 
                    };
                } else {
                    logEntry.context = context;
                }
            } else {
                logEntry.context = context;
            }
        }

        // eslint-disable-next-line no-console
        console.log(JSON.stringify(logEntry)); // Using indentation for readability
    }

    /**
     * Logs a debug message.
     * @param {string} message - The main log message.
     * @param {unknown} [context] - Optional context to include in the log.
     */
    debug(message: string, context?: unknown) {
        this.log(LogLevel.debug, message, context);
    }
    
    /**
     * Logs an info message.
     * @param {string} message - The main log message.
     * @param {unknown} [context] - Optional context to include in the log.
     */
    info(message: string, context?: unknown) {
        this.log(LogLevel.info, message, context);
    }

    /**
     * Logs a warning message.
     * @param {string} message - The main log message.
     * @param {unknown} [context] - Optional context to include in the log.
     */
    warn(message: string, context?: unknown) {
        this.log(LogLevel.warn, message, context);
    }

    /**
     * Logs an error message.
     * @param {string} message - The main log message.
     * @param {unknown} [context] - Optional context to include in the log.
     */
    error(message: string, context?: unknown) {
        this.log(LogLevel.error, message, context);
    }
}
