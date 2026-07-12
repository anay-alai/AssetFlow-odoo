const QRCode = require('qrcode');

/**
 * Generate a QR code (data URI PNG) encoding an asset's identity.
 * The payload is a JSON string so a scanner can resolve the asset directly.
 *
 * @param {Object} asset
 * @param {string} asset.asset_tag
 * @param {number} [asset.id]
 * @returns {Promise<string>} data URI, e.g. "data:image/png;base64,...."
 */
async function generateQrCode({ asset_tag, id }) {
    const payload = JSON.stringify({ type: 'assetflow.asset', asset_tag, id });
    return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 256 });
}

module.exports = { generateQrCode };
