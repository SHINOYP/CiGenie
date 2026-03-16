/**
 * Custom Colored Logger Middleware
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, url } = req;

    // Check status after response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;

        let color = '\x1b[32m'; // Green for 2xx
        if (status >= 300) color = '\x1b[36m'; // Cyan for 3xx
        if (status >= 400) color = '\x1b[33m'; // Yellow for 4xx
        if (status >= 500) color = '\x1b[31m'; // Red for 5xx
        const reset = '\x1b[0m';

        console.log(`${color}[${method}] ${url} - ${status} - ${duration}ms${reset}`);
    });

    next();
};

module.exports = requestLogger;
