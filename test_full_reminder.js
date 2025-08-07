// Test the full reminder functionality
const reminderCommand = require('./commands/reminder');

// Mock sock object
const mockSock = {
    sendMessage: async (chatId, message) => {
        console.log(`📤 Message to ${chatId}:`, message.text);
        return { messageId: 'test' };
    }
};

// Mock message object
function createMockMessage(text, isGroup = false) {
    return {
        key: {
            remoteJid: isGroup ? '1234567890@g.us' : '1234567890@s.whatsapp.net'
        },
        pushName: 'TestUser'
    };
}

// Test function
async function testReminderCommand(command, isGroup = false, isAdmin = true) {
    console.log(`\n🧪 Testing: "${command}"`);
    console.log(`📍 Context: ${isGroup ? 'Group' : 'Private'} chat, ${isAdmin ? 'Admin' : 'User'}`);

    const args = command.split(' ').slice(1); // Remove .reminder
    const message = createMockMessage(command, isGroup);
    const context = {
        isGroup,
        isAdmin,
        groupMetadata: null,
        pushName: 'TestUser',
        sender: '1234567890@s.whatsapp.net'
    };

    try {
        await reminderCommand.execute(mockSock, message, args, context);
        console.log('✅ Command executed successfully');
    } catch (error) {
        console.error('❌ Command failed:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting Reminder Command Tests\n');

    // Test commands that previously failed
    await testReminderCommand('.reminder set meetings at 10:14pm', false);
    await testReminderCommand('.reminder set meetings at 10:15 pm', false);
    await testReminderCommand('.reminder set meetings in 2 minutes', false);

    // Test additional formats
    await testReminderCommand('.reminder set Call John at 3:30pm', false);
    await testReminderCommand('.reminder set Review tomorrow at 9am', false);

    // Test group context (should require admin)
    await testReminderCommand('.reminder set Team meeting at 2pm', true, true);
    await testReminderCommand('.reminder set Team meeting at 2pm', true, false);

    // Test list and help
    await testReminderCommand('.reminder list', false);
    await testReminderCommand('.reminder', false);

    console.log('\n🏁 Tests completed');
}

runTests().catch(console.error);
