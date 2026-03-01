const express = require('express');
const mineflayer = require('mineflayer');
const autoeat = require('mineflayer-auto-eat').plugin;

// --- WEB SERVER FOR RENDER ---
const app = express();
app.get('/', (req, res) => res.send('Bot is Stealthily Active!'));
app.listen(process.env.PORT || 3000);

// --- BOT CONFIGURATION ---
const botArgs = {
    host: 'AJPhantom07.aternos.me', // Apni IP yahan daalein
    port: 25565,                  
    username: 'GhostPlayer_01',    // Bot ka naam
    version: '1.21.11'              // Server version check karein
};

const initBot = () => {
    const bot = mineflayer.createBot(botArgs);
    bot.loadPlugin(autoeat);

    const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

    bot.on('spawn', () => {
        console.log("Joined the server. Starting Human-Like movements...");
        
        // Random intervals pe actions trigger karne ke liye loop
        const mainLoop = () => {
            const nextActionDelay = getRandom(5000, 20000); // 5 to 20 seconds gap
            
            setTimeout(() => {
                performRandomAction(bot);
                mainLoop(); // Recursive call for next action
            }, nextActionDelay);
        };
        
        mainLoop();
    });

    function performRandomAction(bot) {
        const chance = Math.random();

        // 1. Randomly LOOK around (Crucial for anti-cheat)
        const yaw = Math.random() * Math.PI * 2;
        const pitch = (Math.random() - 0.5) * Math.PI;
        bot.look(yaw, pitch);

        if (chance < 0.3) {
            // ACTION A: Run and Jump (Sprint)
            bot.setControlState('forward', true);
            bot.setControlState('jump', true);
            bot.setControlState('sprint', true);
            setTimeout(() => bot.clearControlStates(), getRandom(1000, 3000));
            
        } else if (chance < 0.6) {
            // ACTION B: Random Strafe (Side-ways movement)
            const dir = Math.random() > 0.5 ? 'left' : 'right';
            bot.setControlState(dir, true);
            setTimeout(() => bot.clearControlStates(), getRandom(500, 1500));
            
        } else if (chance < 0.8) {
            // ACTION C: Crouch/Sneak (Human-like behavior)
            bot.setControlState('sneak', true);
            setTimeout(() => bot.setControlState('sneak', false), getRandom(2000, 5000));
            
        } else {
            // ACTION D: Stay still but look around (Idle)
            console.log("Bot is idling to mimic browsing inventory...");
        }
    }

    // Auto-Eat configuration
    bot.on('health', () => {
        if (bot.food < 15) bot.autoEat.eat();
    });

    // Auto-reconnect if kicked
    bot.on('end', () => {
        console.log('Kicked or Disconnected. Re-grouping in 15s...');
        setTimeout(initBot, 15000);
    });

    bot.on('error', err => console.log('Bot Error:', err));
};

initBot();
