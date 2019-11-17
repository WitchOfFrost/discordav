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
});

// Message Area

dc_client.on('message', dc_msg => {

    // Message Logs
    console.log(`[${new Date(Date.now()).toLocaleString()}] ${dc_msg.guild.id} - ${dc_msg.member.user.tag}: ${dc_msg}`);

    // Message Handles

    if (dc_msg.attachments.first()) {
        db_pool.getConnection().then(conn => {
        dc_msg.react('645681399512432660');
        var dl_obj = { dc_msg: dc_msg, db_pool: db_pool };
        module_index.fileload_loader.download(dl_obj)
        });
    };

});
dc_client.login(ext_config.api_config.dc_client_token);