const fs = require('fs');
const path = require('path');

const remindersFile = path.join(__dirname, '..', 'data', 'reminders.json');

// Ensure data directory exists
const dataDir = path.dirname(remindersFile);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load reminders from file
function loadReminders() {
    try {
        if (fs.existsSync(remindersFile)) {
            const data = fs.readFileSync(remindersFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading reminders:', error);
    }
    return [];
}

// Save reminders to file
function saveReminders(reminders) {
    try {
        fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));
    } catch (error) {
        console.error('Error saving reminders:', error);
    }
}

// Parse time input into a Date object
function parseTime(timeInput, timezone = 'Africa/Nairobi') {
    const now = new Date();
    const kenyaTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));

    // Normalize input
    timeInput = timeInput.toLowerCase().trim();

    try {
        // Handle "in X minutes/hours/days" format
        const inMatch = timeInput.match(/^in\s+(\d+)\s+(minute|minutes|min|hour|hours|hr|day|days)$/);
        if (inMatch) {
            const amount = parseInt(inMatch[1]);
            const unit = inMatch[2];

            let milliseconds = 0;
            if (unit.startsWith('min')) {
                milliseconds = amount * 60 * 1000;
            } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
                milliseconds = amount * 60 * 60 * 1000;
            } else if (unit.startsWith('day')) {
                milliseconds = amount * 24 * 60 * 60 * 1000;
            }

            return new Date(kenyaTime.getTime() + milliseconds);
        }

        // Handle "at HH:MM" or "at HH:MMam/pm" or "at HHam/pm" format
        const atTimeMatch = timeInput.match(/^at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
        if (atTimeMatch) {
            let hours = parseInt(atTimeMatch[1]);
            const minutes = parseInt(atTimeMatch[2] || '0'); // Default to 0 if no minutes
            const period = atTimeMatch[3];

            if (period === 'pm' && hours !== 12) {
                hours += 12;
            } else if (period === 'am' && hours === 12) {
                hours = 0;
            }

            const targetTime = new Date(kenyaTime);
            targetTime.setHours(hours, minutes, 0, 0);

            // If the time has passed today, set it for tomorrow
            if (targetTime <= kenyaTime) {
                targetTime.setDate(targetTime.getDate() + 1);
            }

            return targetTime;
        }

        // Handle "on [day] at time" format
        const dayTimeMatch = timeInput.match(/^on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
        if (dayTimeMatch) {
            const dayName = dayTimeMatch[1];
            let hours = parseInt(dayTimeMatch[2]);
            const minutes = parseInt(dayTimeMatch[3] || '0'); // Default to 0 if no minutes
            const period = dayTimeMatch[4];

            if (period === 'pm' && hours !== 12) {
                hours += 12;
            } else if (period === 'am' && hours === 12) {
                hours = 0;
            }

            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDay = days.indexOf(dayName);
            const currentDay = kenyaTime.getDay();

            let daysUntil = targetDay - currentDay;
            if (daysUntil <= 0) {
                daysUntil += 7; // Next week
            }

            const targetTime = new Date(kenyaTime);
            targetTime.setDate(targetTime.getDate() + daysUntil);
            targetTime.setHours(hours, minutes, 0, 0);

            return targetTime;
        }

        // Handle "tomorrow at time" format
        const tomorrowMatch = timeInput.match(/^tomorrow\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
        if (tomorrowMatch) {
            let hours = parseInt(tomorrowMatch[1]);
            const minutes = parseInt(tomorrowMatch[2] || '0'); // Default to 0 if no minutes
            const period = tomorrowMatch[3];

            if (period === 'pm' && hours !== 12) {
                hours += 12;
            } else if (period === 'am' && hours === 12) {
                hours = 0;
            }

            const targetTime = new Date(kenyaTime);
            targetTime.setDate(targetTime.getDate() + 1);
            targetTime.setHours(hours, minutes, 0, 0);

            return targetTime;
        }

        return null;
    } catch (error) {
        console.error('Error parsing time:', error);
        return null;
    }
}

// Format time for display
function formatTime(date) {
    try {
        return date.toLocaleString('en-KE', {
            timeZone: 'Africa/Nairobi',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return date.toString();
    }
}

// Helper function to send messages with retry logic
async function sendMessageWithRetry(sock, chatId, message, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await sock.sendMessage(chatId, message);
            return true;
        } catch (error) {
            console.error(`❌ Send attempt ${attempt} failed:`, error.message);

            // If it's a session error and we have retries left, wait and try again
            if (attempt < maxRetries && (
                error.message.includes('Bad MAC') ||
                error.message.includes('session') ||
                error.message.includes('decrypt')
            )) {
                console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                continue;
            }

            // If we've exhausted retries or it's a different error, throw it
            throw error;
        }
    }
    return false;
}

// Check for due reminders
function checkReminders(sock) {
    const reminders = loadReminders();
    const now = new Date();
    const kenyaTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));

    const dueReminders = [];
    const remainingReminders = [];

    reminders.forEach(reminder => {
        const reminderTime = new Date(reminder.time);
        if (reminderTime <= kenyaTime) {
            dueReminders.push(reminder);
        } else {
            remainingReminders.push(reminder);
        }
    });

    // Send due reminders
    dueReminders.forEach(async (reminder) => {
        try {
            const message = `🔔 *Reminder*\n\n${reminder.message}\n\n_Set by: @${reminder.setBy}_`;
            await sendMessageWithRetry(sock, reminder.chatId, { text: message, mentions: [reminder.setBy] });
            console.log(`✅ Reminder sent successfully: "${reminder.message}"`);
        } catch (error) {
            console.error('❌ Failed to send reminder after retries:', error.message);
            // Don't remove the reminder if sending failed - try again next time
        }
    });

    // Save remaining reminders
    if (dueReminders.length > 0) {
        saveReminders(remainingReminders);
    }
}

// Start reminder checker
let reminderInterval;
function startReminderChecker(sock) {
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }

    reminderInterval = setInterval(() => {
        checkReminders(sock);
    }, 60000); // Check every minute
}

module.exports = {
    command: 'reminder',
    alias: ['remind', 'timer'],
    category: 'admin',
    description: 'Set, list, or delete reminders',
    usage: '.reminder set <time> <message> | .reminder list | .reminder delete <number>',

    async execute(sock, msg, args, { isGroup, isAdmin, groupMetadata, pushName, sender }) {
        const chatId = msg.key.remoteJid;
        const command = args[0]?.toLowerCase();

        // Add debugging
        console.log(`🔍 Reminder command: "${command}", Args:`, args);
        console.log(`📍 Context: Group=${isGroup}, Admin=${isAdmin}, Sender=${sender}`); try {
            if (!command) {
                return await sendMessageWithRetry(sock, chatId, {
                    text: `*Reminder Commands:*\n\n` +
                        `• *.reminder set <time> <message>* - Set a reminder\n` +
                        `• *.reminder list* - View your reminders\n` +
                        `• *.reminder delete <number>* - Delete a reminder\n\n` +
                        `*Time formats:*\n` +
                        `• "in 30 minutes"\n` +
                        `• "in 2 hours"\n` +
                        `• "at 3:30pm"\n` +
                        `• "tomorrow at 9am"\n` +
                        `• "on friday at 7pm"\n\n` +
                        `_Note: In groups, only admins can set reminders._`
                });
            } if (command === 'set') {
                // Check if user is admin in group chats
                if (isGroup && !isAdmin) {
                    return await sendMessageWithRetry(sock, chatId, {
                        text: '❌ Only group admins can set reminders in groups.'
                    });
                }

                if (args.length < 3) {
                    return await sendMessageWithRetry(sock, chatId, {
                        text: '❌ Usage: .reminder set <message> <time>\n\nExample: .reminder set "Meeting starts" "in 30 minutes"\nOr: .reminder set "Call John" "at 3:30pm"'
                    });
                }

                // Extract message and time - be more flexible with parsing
                const fullText = args.slice(1).join(' ');

                // Try different parsing strategies
                let timeStr = '';
                let message = '';

                // Strategy 1: Look for time patterns and split accordingly
                const timePatterns = [
                    /\b(in\s+\d+\s+(?:minute|minutes|min|hour|hours|hr|day|days))\b/i,
                    /\b(tomorrow\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
                    /\b(on\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
                    /\b(at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i
                ];

                for (const pattern of timePatterns) {
                    const match = fullText.match(pattern);
                    if (match) {
                        timeStr = match[1];
                        // Everything else is the message
                        message = fullText.replace(match[0], '').trim();
                        break;
                    }
                }                // If no pattern matched, fall back to trying quoted format
                if (!timeStr) {
                    const quotedMatch = fullText.match(/^"([^"]+)"\s+"([^"]+)"$/);
                    if (quotedMatch) {
                        message = quotedMatch[1];
                        timeStr = quotedMatch[2];
                    } else {
                        return await sendMessageWithRetry(sock, chatId, {
                            text: '❌ Could not parse time. Please use formats like:\n\n' +
                                '• ".reminder set Meeting in 30 minutes"\n' +
                                '• ".reminder set Call John at 3:30pm"\n' +
                                '• ".reminder set Dinner tomorrow at 7pm"\n' +
                                '• ".reminder set Review at monday 9am"'
                        });
                    }
                }

                if (!message || !timeStr) {
                    return await sendMessageWithRetry(sock, chatId, {
                        text: '❌ Both message and time are required.\n\nExample: .reminder set "Meeting starts" "in 30 minutes"'
                    });
                } const reminderTime = parseTime(timeStr);
                if (!reminderTime || isNaN(reminderTime.getTime())) {
                    return await sendMessageWithRetry(sock, chatId, {
                        text: '❌ Invalid time format. Please use:\n\n' +
                            '• "in 30 minutes"\n' +
                            '• "in 2 hours"\n' +
                            '• "at 3:30pm"\n' +
                            '• "tomorrow at 9am"\n' +
                            '• "on friday at 7pm"'
                    });
                }

                // Check if time is in the future
                const now = new Date();
                const kenyaTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));

                if (reminderTime <= kenyaTime) {
                    return await sendMessageWithRetry(sock, chatId, {
                        text: '❌ The reminder time must be in the future.'
                    });
                }

                // Save reminder
                const reminders = loadReminders();
                const newReminder = {
                    id: Date.now(),
                    chatId: chatId,
                    setBy: sender,
                    message: message,
                    time: reminderTime.toISOString(),
                    setAt: new Date().toISOString()
                }; reminders.push(newReminder);
                saveReminders(reminders);

                const formattedTime = formatTime(reminderTime);
                await sendMessageWithRetry(sock, chatId, {
                    text: `✅ *Reminder Set!*\n\n📝 *Message:* ${message}\n⏰ *Time:* ${formattedTime}\n👤 *Set by:* ${pushName}`
                });

            } else if (command === 'list') {
                const reminders = loadReminders();
                const userReminders = reminders.filter(r => r.chatId === chatId);

                if (userReminders.length === 0) {
                    return await sendMessageWithRetry(sock, chatId, {
                        text: '📭 No reminders set for this chat.'
                    });
                }

                let listText = '*📋 Active Reminders:*\n\n'; userReminders.forEach((reminder, index) => {
                    const time = formatTime(new Date(reminder.time));
                    listText += `${index + 1}. 📝 ${reminder.message}\n`;
                    listText += `   ⏰ ${time}\n`;
                    listText += `   👤 Set by: @${reminder.setBy.split('@')[0]}\n\n`;
                });

                await sendMessageWithRetry(sock, chatId, { text: listText });

            } else if (command === 'delete') {
                const reminderNum = parseInt(args[1]);
                if (!reminderNum) {
                    return await sendMessageWithRetry(sock, chatId, {
                        text: '❌ Please specify reminder number to delete.\nUse .reminder list to see reminder numbers.'
                    });
                }

                const reminders = loadReminders();
                const chatReminders = reminders.filter(r => r.chatId === chatId);

                if (reminderNum > chatReminders.length || reminderNum < 1) {
                    return await sendMessageWithRetry(sock, chatId, {
                        text: '❌ Invalid reminder number. Use .reminder list to see available reminders.'
                    });
                } const reminderToDelete = chatReminders[reminderNum - 1];

                // Check if user can delete (admin or the person who set it)
                if (isGroup && !isAdmin && reminderToDelete.setBy !== sender) {
                    return await sendMessageWithRetry(sock, chatId, {
                        text: '❌ You can only delete your own reminders, unless you are an admin.'
                    });
                }

                // Remove reminder
                const updatedReminders = reminders.filter(r => r.id !== reminderToDelete.id);
                saveReminders(updatedReminders);

                await sendMessageWithRetry(sock, chatId, {
                    text: `✅ Reminder deleted: "${reminderToDelete.message}"`
                });

            } else {
                await sendMessageWithRetry(sock, chatId, {
                    text: '❌ Invalid command. Use: set, list, or delete'
                });
            }

        } catch (error) {
            console.error('Reminder command error:', error);
            await sendMessageWithRetry(sock, chatId, {
                text: '❌ An error occurred while processing your reminder command.'
            });
        }
    },

    // Initialize reminder system
    init(sock) {
        startReminderChecker(sock);
        console.log('Reminder system initialized');
    }
};
