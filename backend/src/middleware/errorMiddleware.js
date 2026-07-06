const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Mongoose bad object ID
    if (err.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        return res.status(400).json({ success: false, message: 'Duplicate field value entered' });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        return res.status(400).json({ success: false, message });
    }

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = { errorHandler };
