const { Booking, Asset, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getResourceBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.findAll({ where: { resource_asset_id: req.params.id } });
        res.json({ success: true, data: bookings });
    } catch (error) { next(error); }
};

exports.createBooking = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { resource_asset_id, start_time, end_time, purpose } = req.body;
        const booked_by = req.user.id;
        
        const asset = await Asset.findByPk(resource_asset_id, { transaction: t });
        if (!asset || !asset.is_bookable) {
            await t.rollback();
            return res.status(400).json({ success: false, error: { message: 'Asset is not a bookable resource' } });
        }
        
        const conflictingBooking = await Booking.findOne({
            where: {
                resource_asset_id,
                status: { [Op.in]: ['Upcoming', 'Ongoing'] },
                start_time: { [Op.lt]: new Date(end_time) },
                end_time: { [Op.gt]: new Date(start_time) }
            },
            transaction: t
        });
        
        if (conflictingBooking) {
            await t.rollback();
            return res.status(409).json({ success: false, error: { code: 'BOOKING_OVERLAP', message: 'Resource is already booked during this time' } });
        }
        
        const booking = await Booking.create({ resource_asset_id, booked_by, start_time, end_time, purpose }, { transaction: t });
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
        if (!booking) return res.status(404).json({ success: false, error: { message: 'Booking not found' } });
        await booking.update({ status: 'Cancelled' });
        res.json({ success: true, data: booking });
    } catch (error) { next(error); }
};