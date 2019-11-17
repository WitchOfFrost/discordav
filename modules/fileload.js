const request = require(`request`);
const fs = require(`fs`);
const local_scan = require('clamscan');
const sha256 = require('sha256-file');
const clamavscan = new local_scan().init({
    remove_infected: false,
    quarantine_infected: false,
    debug_mode: true,
    clamscan: {
        path: '/usr/bin/clamscan',
        scan_archives: true
    },
    preference: 'clamdscan'
});

module.exports.download = async function (dl_obj) {
    dl_obj.db_pool.getConnection().then(conn => {
        var ignored_files = [`png`, `txt`, `gif`, `jpg`, `jpeg`, `tif`, `tiff`, `mp3`, `wav`, `avi`, `mpg`, `mpeg`, `webm`, `wmv`, `flv`, `mov`, `mp4`];



        dl_obj.dc_msg.attachments.forEach(attached => {



            var filename_check = attached.filename.split(".");

            if (ignored_files.includes(filename_check.slice(-1)[0])) {
                console.log(`Detected ${filename_check.slice(-1)[0]} file extension, marked safe -> Returning`);
                return;
            } else {
                file_download(attached.url)
            };

            async function file_download(url) {
                await request.get(url)
                    .on('error', console.error)
                    .pipe(await fs.createWriteStream(`./files/${attached.filename}`));
                conn.query(`SELECT * FROM filehash WHERE sha256sum="${sha256(`./files/${attached.filename}`)}"`).then(response_hash => {

                    if ( response_hash[0].filehash == undefined) {
                        clamavscan.then(async clamscan => {
                            
                            console.log("Scanning File...")
                            var { is_infected, file, viruses } = await clamscan.is_infected(`./files/${attached.filename}`);
                            if (is_infected) {
                                console.log(`${file} is infected with ${viruses}!`);
                                conn.query(`INSERT INTO filehash (sha256sum, filename, clam_detection) VALUES (${sha256(`./files/${attached.filename}`)}, ${attached.filename}, 1)`)
                            } else {
                                console.log(`File ${file} is clean.`);
                                conn.query(`INSERT INTO filehash (sha256sum, filename, clam_detection) VALUES ("${sha256(`./files/${attached.filename}`)}", "${attached.filename}", 0)`)
                            }
                        }).catch(err => { console.log(err) });

                    } else {
                        conn.query(`SELECT * FROM filehash WHERE sha256sum = "${sha256(`./files/${attached.filename}`)}"`).then(res => {
                            console.log(res)
                        });
                    };
                });
            };
        });
    });
};