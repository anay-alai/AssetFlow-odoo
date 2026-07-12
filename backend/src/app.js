const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const orgRoutes = require('./routes/orgRoutes');
const assetRoutes = require('./routes/assetRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const auditRoutes = require('./routes/auditRoutes');

const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api', orgRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance-requests', maintenanceRoutes);
app.use('/api/audit-cycles', auditRoutes);
// Backwards-compatible mount for older frontend routes using `/api/audits`.
app.use('/api/audits', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Serve uploaded photos/documents.
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'AssetFlow API is running' });
});

app.use((err, req, res, next) => {
    // Multer upload errors
    if (err && err.name === 'MulterError') {
        return res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: err.message } });
    }
    // Sequelize validation / unique-constraint errors
    if (err && (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError')) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: err.message, details: (err.errors || []).map((e) => e.message) },
        });
    }
    if (err && err.message && err.message.startsWith('Unsupported file type')) {
        return res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: err.message } });
    }

    // Surface the underlying DB error message (Sequelize wraps it in err.parent/err.original).
    const sqlMessage = (err.parent && err.parent.sqlMessage) || (err.original && err.original.message);
    console.error('[error]', err.name, '-', sqlMessage || err.message);
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            details: sqlMessage || err.message
        }
    });
});

module.exports = app;
