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
        //var ignored_files = [`png`, `txt`, `gif`, `jpg`, `jpeg`, `tif`, `tiff`, `mp3`, `wav`, `avi`, `mpg`, `mpeg`, `webm`, `wmv`, `flv`, `mov`, `mp4`];
        var ignored_files = []


        dl_obj.dc_msg.attachments.forEach(attached => {
            var filename_check = attached.filename.split(".");

            if (ignored_files.includes(filename_check.slice(-1)[0])) {
                console.log(`Detected ${filename_check.slice(-1)[0]} file extension, marked safe -> Returning`);
                return;
            } else {
                dl_obj.url = attached.url
                file_download(dl_obj)
            };

            async function file_download(dl_obj) {
                request.get(dl_obj.url)
                    .on('error', console.error)
                    .pipe(fs.createWriteStream(`./files/${attached.filename}`))
                await conn.query(`INSERT IGNORE INTO filehash (sha256sum, filename) VALUES ("${sha256(`./files/${attached.filename}`)}", "${attached.filename}")`).then(res => console.log(res))
                await file_scan(dl_obj)
                conn.end()
            };










            async function file_scan(dl_obj) {

                conn.query(`SELECT * FROM filehash WHERE sha256sum="${sha256(`./files/${attached.filename}`)}"`).then(response_hash => {
                    if (response_hash[0].filehash.clam_detection == undefined) {
                        clamavscan.then(async clamscan => {

                            console.log("Scanning File...")
                            var { is_infected, file, viruses } = await clamscan.is_infected(`./files/${attached.filename}`);
                            if (is_infected) {
                                console.log(`${file} is infected with ${viruses}!`);
                                conn.query(`UPDATE filehash SET clam_detection = 1 WHERE sha256sum = "${sha256(`./files/${attached.filename}`)}"`)
                                dl_obj.dc_msg.delete();
                            } else {
                                console.log(`File ${file} is clean.`);
                                conn.query(`UPDATE filehash SET clam_detection = 0 WHERE sha256sum = "${sha256(`./files/${attached.filename}`)}"`)
                                dl_obj.dc_msg.clearReactions();
                            }
                        }).catch(err => { console.log(err) });

                    } else {
                        if (response_hash[0].filehash.clam_detection == 1) {
                            console.log(`File with Hash ${sha256(`./files/${attached.filename}`)} already scanned, Infected`)
                            dl_obj.dc_msg.delete();
                        } else {
                            console.log(`File with Hash ${sha256(`./files/${attached.filename}`)} already scanned, Clean`)
                            dl_obj.dc_msg.clearReactions();
                        }

                    };
                });
            };
        });
    });
};