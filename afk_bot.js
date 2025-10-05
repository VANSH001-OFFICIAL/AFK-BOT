const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const http = require('http'); 

// --- ⚙️ कॉन्फ़िगरेशन (Environment Variables का उपयोग) ---
// --- ⚙️ कॉन्फ़िगरेशन (Hardcoded Values के साथ) ---
const BOT_CONFIG = {
    // आपका सर्वर IP/डोमेन कोटेशन मार्क्स ('') के अंदर होना चाहिए।
    host: 'Vansh2041.aternos.me',  
    // पोर्ट नंबर को सीधा संख्या के रूप में लिखें।
    port: 45423,               
    // आपका यूज़रनेम कोटेशन मार्क्स ('') के अंदर होना चाहिए।
    username: 'AFKBot',   
    
    // अगर आपके सर्वर को पासवर्ड चाहिए, तो यह Environment Variable से आएगा
    password: process.env.MC_PASSWORD, 
};

// ... बाकी code यहाँ से जारी रहेगा।

// सुनिश्चित करें कि होस्ट सेट है
if (!BOT_CONFIG.host) {
    console.error("❌ ERROR: MC_HOST Environment Variable is not set. Please set it in the Render dashboard.");
    process.exit(1);
}


const bot = mineflayer.createBot(BOT_CONFIG);
bot.loadPlugin(pathfinder);
let isAfkMoving = false;

// --- 🌐 Render को सक्रिय रखने के लिए Web Server ---
// यह सर्वर Uptime Robot जैसे टूल से पिंग रिसीव करके Render को सोने से रोकेगा।

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    // हर पिंग पर 200 OK जवाब भेजें
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Minecraft AFK Bot is alive!');
}).listen(PORT, () => {
    console.log(`🚀 Render web server started on port ${PORT}. Bot is ready for pings.`);
});


// --- 🚀 मुख्य इवेंट हैंडलर ---

bot.on('spawn', () => {
    console.log(`✅ ${bot.username} सर्वर में सफलतापूर्वक जुड़ गया!`);
    
    // Pathfinder setup
    const mcData = require('minecraft-data')(bot.version);
    bot.pathfinder.setMovements(new Movements(bot, mcData));

    startAfkMovement();
    startPeriodicChat();
});

bot.on('chat', (username, message) => {
    if (username === bot.username) return; 
    if (message.includes('hello bot') || message.includes('hi bot')) {
        bot.chat(`Hello, ${username}! मैं AFK पर हूँ.`);
    }
});

bot.on('kicked', (reason) => console.log(`❌ किक किया गया: ${reason}`));
bot.on('error', (err) => console.error(`❌ एरर: ${err.message}`));
bot.on('end', () => console.log('🛑 डिसकनेक्ट हुआ.'));


// --- 🚶 AFK मूवमेंट लॉजिक ---

function startAfkMovement() {
    if (isAfkMoving) return;
    isAfkMoving = true;
    
    const controls = ['forward', 'back', 'left', 'right', 'jump'];
    
    const movementLoop = () => {
        if (!isAfkMoving || bot.isSleeping) {
            controls.forEach(control => bot.setControlState(control, false));
            return;
        }

        controls.forEach(control => bot.setControlState(control, false));

        const randomControl = controls[Math.floor(Math.random() * controls.length)];
        const duration = Math.random() * 3000 + 1000; 

        bot.setControlState(randomControl, true);
        
        setTimeout(() => {
            bot.setControlState(randomControl, false);
            setTimeout(movementLoop, 500); 
        }, duration);
    };

    movementLoop();
}

// --- 💬 चैट लॉजिक ---

function startPeriodicChat() {
    const messages = [
        "बस AFK पर हूँ! मैं सक्रिय हूँ!", 
        "सर्वर पर सभी को नमस्कार!", 
        "AFK चेक: पास"
    ];

    setInterval(() => {
        if (!bot.isSleeping) {
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            bot.chat(randomMessage);
        }
    }, 10 * 60 * 1000); // 10 minutes
}

// --- 🛌 रात में सोने का लॉजिक ---

bot.on('time', () => {
    const timeOfDay = bot.time.timeOfDay;
    const isNight = timeOfDay > 12500 && timeOfDay < 23460;

    if (isNight && !bot.isSleeping && bot.pathfinder.isGoalSet() === false) {
        attemptToSleep();
    }
});

async function attemptToSleep() {
    const bedBlock = bot.findBlock({
        matching: block => bot.registry.beds.includes(block.name),
        maxDistance: 32,
    });

    if (!bedBlock) return;

    try {
        isAfkMoving = false;
        await bot.pathfinder.goto(new goals.GoalGetToBlock(bedBlock.position.x, bedBlock.position.y, bedBlock.position.z));
        await bot.sleep(bedBlock);
        console.log("💤 बेड में प्रवेश किया।");

    } catch (err) {
        bot.pathfinder.stop(); 
    }
}

bot.on('wake', () => {
    console.log("☀️ सुबह हो गई, उठ गया हूँ!");
    isAfkMoving = true;
    startAfkMovement();
});
