const { Booking, Asset, sequelize } = require('../models');
const { Op } = require('sequelize');
const { conflictWhere, validateWindow } = require('../services/booking.service');
const { notify } = require('../services/notification.service');
const { logActivity } = require('../utils/activityLogger');

exports.getResourceBookings = async (req, res, next) => {
    try {
        const where = { resource_asset_id: req.params.id };
        // Optional date filter: ?date=YYYY-MM-DD returns that day's bookings.
        if (req.query.date) {
            const day = new Date(req.query.date);
            const start = new Date(day.setHours(0, 0, 0, 0));
            const end = new Date(day.setHours(23, 59, 59, 999));
            where.start_time = { [Op.lte]: end };
            where.end_time = { [Op.gte]: start };
        }
        const bookings = await Booking.findAll({ where, include: ['Booker'], order: [['start_time', 'ASC']] });
        res.json({ success: true, data: bookings });
    } catch (error) { next(error); }
};

exports.createBooking = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { resource_asset_id, start_time, end_time, purpose } = req.body;
        const booked_by = req.user.id;

        const win = validateWindow(start_time, end_time);
        if (!win.valid) {
            await t.rollback();
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: win.reason } });
        }

        const asset = await Asset.findByPk(resource_asset_id, { lock: t.LOCK.UPDATE, transaction: t });
        if (!asset || !asset.is_bookable) {
            await t.rollback();
            return res.status(400).json({ success: false, error: { code: 'NOT_BOOKABLE', message: 'Asset is not a bookable resource' } });
        }

        const conflicting = await Booking.findOne({
            where: conflictWhere(resource_asset_id, start_time, end_time),
            transaction: t,
        });
        if (conflicting) {
            await t.rollback();
            return res.status(409).json({
                success: false,
                error: {
                    code: 'BOOKING_OVERLAP',
                    message: 'Resource is already booked during this time',
                    details: {
                        conflictingBooking: {
                            id: conflicting.id,
                            start_time: conflicting.start_time,
                            end_time: conflicting.end_time,
                        },
                    },
                },
            });
        }

        const booking = await Booking.create({ resource_asset_id, booked_by, start_time, end_time, purpose }, { transaction: t });
        await logActivity({ user_id: booked_by, action: 'booking.created', entity_type: 'Booking', entity_id: booking.id }, t);
        await notify({ user_id: booked_by, type: 'Booking Confirmed', message: `Your booking for ${asset.asset_tag} is confirmed.`, related_entity_type: 'Booking', related_entity_id: booking.id }, t);

        await t.commit();
        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
        await booking.update({ status: 'Cancelled' });
        await logActivity({ user_id: req.user.id, action: 'booking.cancelled', entity_type: 'Booking', entity_id: booking.id });
        await notify({ user_id: booking.booked_by, type: 'Booking Cancelled', message: `Your booking #${booking.id} was cancelled.`, related_entity_type: 'Booking', related_entity_id: booking.id });
        res.json({ success: true, data: booking });
    } catch (error) { next(error); }
};

exports.rescheduleBooking = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { start_time, end_time } = req.body;
        const booking = await Booking.findByPk(req.params.id, { transaction: t });
        if (!booking) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
        }

        const win = validateWindow(start_time, end_time);
        if (!win.valid) {
            await t.rollback();
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: win.reason } });
        }

        // Re-run the overlap check against the new window, excluding this booking's own row.
        const conflicting = await Booking.findOne({
            where: conflictWhere(booking.resource_asset_id, start_time, end_time, booking.id),
            transaction: t,
        });
        if (conflicting) {
            await t.rollback();
            return res.status(409).json({
                success: false,
                error: { code: 'BOOKING_OVERLAP', message: 'Resource is already booked during the new time', details: { conflictingBooking: { id: conflicting.id, start_time: conflicting.start_time, end_time: conflicting.end_time } } },
            });
        }

        await booking.update({ start_time, end_time }, { transaction: t });
        await logActivity({ user_id: req.user.id, action: 'booking.rescheduled', entity_type: 'Booking', entity_id: booking.id }, t);
        await t.commit();
        res.json({ success: true, data: booking });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};
