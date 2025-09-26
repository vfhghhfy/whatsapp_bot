// قائمة إيموجيات مميزة وأنيقة
const allowedEmojis = [
  '❤️','💖','💜','🤍',   // قلوب
  '🔥','✨','🌹','⭐',    // طاقة ونار وورد ونجوم
  '💎','🌸','🍀','🌙',   // جواهر وزهور وحظ وقمر
  '💫','🎶','🎉','⚡',    // طاقة واحتفال
  '🥰','😎','🤩','😍',   // وجوه تعبيرية جميلة
  '👑','🦋','☁️','🌈',   // تاج وفراشة وغيوم وقوس قزح
  '🐱','🐼','🪽','🌻'    // حيوانات وزهور
];

// أرقام المطورين
const ownerNumbers = [
  "967778668253@s.whatsapp.net",   // رقمك الأول
  "963948879856@s.whatsapp.net"    // الرقم الجديد
];

export async function before(m, { conn }) {
  if (m.isBaileys && m.fromMe) return true;

  // السماح فقط للمطورين
  if (!ownerNumbers.includes(m.sender)) return true;

  try {
    // اختيار إيموجي عشوائي من القائمة
    const randomEmoji = allowedEmojis[(Math.random() * allowedEmojis.length) | 0];
    
    await conn.sendMessage(m.chat, {
      react: { text: randomEmoji, key: m.key }
    });

  } catch (error) {
    console.error('Error reacting to message:', error);
  }

  return true;
}
