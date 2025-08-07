// Test the new search commands
const googleCommand = require('./commands/google');
const apkCommand = require('./commands/apk');
const playstoreCommand = require('./commands/playstore');

// Mock sock object
const mockSock = {
    sendMessage: async (chatId, message) => {
        console.log(`📤 Message to ${chatId}:`, message.text.substring(0, 100) + '...');
        return { messageId: 'test' };
    }
};

// Mock message object
function createMockMessage(text) {
    return {
        key: {
            remoteJid: '1234567890@s.whatsapp.net'
        },
        pushName: 'TestUser'
    };
}

// Test function
async function testCommand(command, args, commandName) {
    console.log(`\n🧪 Testing ${commandName}: "${args.join(' ')}"`);

    const message = createMockMessage();

    try {
        await command.execute(mockSock, message, args);
        console.log('✅ Command executed successfully');
    } catch (error) {
        console.error('❌ Command failed:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting Search Commands Tests\n');

    // Test help messages (empty args)
    await testCommand(googleCommand, [], 'Google Search');
    await testCommand(apkCommand, [], 'APK Search');
    await testCommand(playstoreCommand, [], 'Play Store Search');

    console.log('\n🏁 Tests completed');
}

runTests().catch(console.error);
