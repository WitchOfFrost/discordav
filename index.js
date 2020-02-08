const Discord = require('discord.js');
const dc_client = new Discord.Client();
const ext_config = require('./config.json');
const module_index = require('./module_index.js');
const mariadb = require('mariadb');
const fs = require('fs')



// Pre Init

const db_pool = mariadb.createPool({
    database: `${ext_config.database_config.database}`,
    host: `${ext_config.database_config.host}`,
    user: `${ext_config.database_config.user}`,
    password: `${ext_config.database_config.password}`,
    connectionLimit: 10,
    nestTables: true,
    connectTimeout: 10000000000000
});

dc_client.on('ready', ready_state => {
    console.log(`Logged in as ${dc_client.user.tag}!\n`);

    db_pool.getConnection().then(conn => {
        console.log("Checking if Table exists...")
        conn.query('CREATE TABLE IF NOT EXISTS av_db.filehash (sha256sum varchar(256) NOT NULL PRIMARY KEY, filename TEXT NULL, clam_detection BOOL NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=1;')
        conn.end().then(console.log("Check done."))
    });
});

// Message Area

dc_client.on('message', async dc_msg => {

    // Message Logs
    console.log(`[${new Date(Date.now()).toLocaleString()}] ${dc_msg.guild.id} - ${dc_msg.member.user.tag}: ${dc_msg}`);

    // Message Handles

    if (dc_msg.attachments.first()) {
        db_pool.getConnection().then(async conn => {
            let bot_reaction = await dc_msg.react('645681399512432660');
            var dl_obj = { dc_msg: dc_msg, db_pool: db_pool, dc_client: dc_client, bot_reaction: bot_reaction };
            module_index.fileload_loader.download(dl_obj)
            conn.end()
        });
    };

});
dc_client.login(ext_config.api_config.dc_client_token);