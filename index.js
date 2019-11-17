const Discord = require('discord.js');
const dc_client = new Discord.Client();
const ext_config = require('./config.json');

// Pre Init

dc_client.on('ready', ready_state => {
    console.log(`Logged in as ${dc_client.user.tag}!\n`);
});

// Message Area

dc_client.on('message', msg => {

});
dc_client.login(ext_config.dc_client_token);