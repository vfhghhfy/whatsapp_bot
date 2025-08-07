// Test the retry logic
const reminderCommand = require('./commands/reminder');

// Mock sock object that simulates session errors
const mockSockWithErrors = {
    sendMessage: async (chatId, message) => {
        console.log(`📤 Attempting to send to ${chatId}:`, message.text?.substring(0, 50) + '...');

        // Simulate session error on first attempt
        if (!this.retryCount) this.retryCount = 0;
        this.retryCount++;

        if (this.retryCount <= 2) {
            throw new Error('Bad MAC Error: Session decrypt failed');
        }

        console.log(`✅ Message sent successfully on attempt ${this.retryCount}`);
        this.retryCount = 0; // Reset for next test
        return { messageId: 'test' };
    }
};

// Test function
async function testRetryLogic() {
    console.log('🧪 Testing retry logic with session errors\n');

    const args = ['set', 'Test', 'message', 'in', '5', 'minutes'];
    const message = {
        key: { remoteJid: '1234567890@s.whatsapp.net' },
        pushName: 'TestUser'
    };
    const context = {
        isGroup: false,
        isAdmin: true,
        groupMetadata: null,
        pushName: 'TestUser',
        sender: '1234567890@s.whatsapp.net'
    };

    try {
        await reminderCommand.execute(mockSockWithErrors, message, args, context);
        console.log('\n✅ Retry logic test passed!');
    } catch (error) {
        console.error('\n❌ Retry logic test failed:', error.message);
    }
}

testRetryLogic();
