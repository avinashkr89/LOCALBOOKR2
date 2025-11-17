const adminService = require('../../backend/src/services/admin.service');
const authService = require('../../backend/src/services/auth.service');

// Netlify Function wrapper for OTP
exports.handler = async (event, context) => {
  try {
    const { httpMethod } = event;

    if (httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Only POST method allowed'
          }
        })
      };
    }

    const body = JSON.parse(event.body);
    const { phone } = body;

    // Call existing service logic
    const result = await authService.sendOTP(phone);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send OTP'
        }
      })
    };
  }
};