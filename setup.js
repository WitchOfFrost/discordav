const shell = require('shelljs');
const config = require('./config.json');

shell.echo('Checking Dependencies...');
shell.echo();

if (!shell.which('mysql')) {
    shell.echo('Please install mysql from your package manager!');
    shell.exit(1);
} else {
    shell.echo('mysql installed.');
}

if (!shell.which('mariadb')) {
    shell.echo('Please install mariadb from your package manager!');
    shell.exit(1);
} else {
    shell.echo('mariadb installed.');
}

shell.echo();
shell.echo('Executing db installation...');
shell.echo();
shell.echo('Please enter your mysql root password for user and database creation.');

shell.exec(`mysql -u root -p -e "CREATE USER IF NOT EXISTS '${config.database_config.user}'@'${config.database_config.host}' IDENTIFIED BY '${config.database_config.password}'; CREATE DATABASE IF NOT EXISTS ${config.database_config.database}; GRANT ALL PRIVILEGES ON ${config.database_config.database}.* TO ${config.database_config.user}@${config.database_config.host};"`);
shell.echo();
shell.echo('Setup Complete.');
shell.exit(0)