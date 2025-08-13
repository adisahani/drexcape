const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// AI Usage model
const AIUsage = require('./models/AIUsage');

const viewAILogs = async () => {
  try {
    await connectDB();
    
    console.log('\n🤖 AI Usage Logs Viewer');
    console.log('========================\n');
    
    // Get recent AI logs
    const logs = await AIUsage.find({})
      .sort({ createdAt: -1 })
      .limit(10);
    
    if (logs.length === 0) {
      console.log('No AI usage logs found.');
      return;
    }
    
    logs.forEach((log, index) => {
      console.log(`\n📋 Log #${index + 1} - ${log.endpoint}`);
      console.log(`⏰ Date: ${new Date(log.createdAt).toLocaleString()}`);
      console.log(`✅ Status: ${log.responseStatus}`);
      console.log(`⏱️ Response Time: ${log.responseTime}ms`);
      console.log(`💰 Cost: $${log.cost.toFixed(4)}`);
      console.log(`🔢 Tokens: ${log.tokensUsed}`);
      
      // Show request data (input)
      if (log.requestData && Object.keys(log.requestData).length > 0) {
        console.log('\n📥 REQUEST DATA (Input):');
        console.log('------------------------');
        console.log(JSON.stringify(log.requestData, null, 2));
      }
      
      // Show response data (output)
      if (log.responseData && Object.keys(log.responseData).length > 0) {
        console.log('\n📤 RESPONSE DATA (Output):');
        console.log('-------------------------');
        console.log(JSON.stringify(log.responseData, null, 2));
      }
      
      console.log('\n' + '='.repeat(80));
    });
    
  } catch (error) {
    console.error('❌ Error viewing AI logs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the script
viewAILogs();
