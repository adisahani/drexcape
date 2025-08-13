const AIUsage = require('../models/AIUsage');

const trackAIUsage = (endpoint) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Track request data
    const requestData = {
      body: req.body,
      query: req.query,
      params: req.params
    };

    // Override response methods to capture response data
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      const responseStatus = res.statusCode < 400 ? 'success' : 'error';
      
      // Save usage data asynchronously (don't block response)
      saveUsageData(endpoint, requestData, data, responseStatus, responseTime, req);
      
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      const responseTime = Date.now() - startTime;
      const responseStatus = res.statusCode < 400 ? 'success' : 'error';
      
      // Save usage data asynchronously (don't block response)
      saveUsageData(endpoint, requestData, data, responseStatus, responseTime, req);
      
      return originalJson.call(this, data);
    };

    next();
  };
};

const saveUsageData = async (endpoint, requestData, responseData, responseStatus, responseTime, req) => {
  try {
    // Skip if MongoDB is not connected
    if (!process.env.MONGODB_URI) {
      return;
    }

    const usageData = {
      endpoint,
      userId: req.headers['user-id'] || 'anonymous',
      requestData,
      responseData, // Add complete response data
      responseStatus,
      responseTime,
      tokensUsed: 0, // Will be calculated based on response
      cost: 0, // Will be calculated based on tokens
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Calculate tokens and cost (rough estimation)
    if (responseStatus === 'success') {
      // Estimate tokens based on request and response data
      const requestText = JSON.stringify(requestData.body || {});
      const responseText = JSON.stringify(responseData || {});
      usageData.tokensUsed = Math.ceil((requestText.length + responseText.length) / 4); // Rough token estimation
      usageData.cost = (usageData.tokensUsed * 0.0001); // Rough cost estimation
    }

            // console.log('🔍 Tracking Debug: Saving usage data for endpoint:', endpoint);
        // console.log('🔍 Tracking Debug: Response status:', responseStatus);
        // console.log('🔍 Tracking Debug: Response time:', responseTime, 'ms');
        // console.log('🔍 Tracking Debug: Request data size:', JSON.stringify(requestData).length, 'chars');
        // console.log('🔍 Tracking Debug: Response data size:', JSON.stringify(responseData).length, 'chars');

    await AIUsage.create(usageData);
            // console.log('🔍 Tracking Debug: Usage data saved successfully');
  } catch (error) {
    console.error('Error saving AI usage data:', error);
    // Don't throw error to avoid affecting the main response
  }
};

module.exports = { trackAIUsage };
