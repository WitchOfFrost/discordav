# discordav

A Networked antivirus discord bot, using remote scanning by Virustotal and Hybrid Analysis, Link indexing and global blacklist.

## Setup

For beginners:
- `cd`
- `npm i`
- Copy config.example.json and fill in your Discord Bot Token and a user password for the DB User.
- Rename config.example.json to config.json
- `node setup.js`
- Enter your mysql root password when prompted
- `node index.js || pm2 start index.js --name DiscordAV`

For advanced users:
Follow beginner steps or use your own database configuration in config.json