const request = require(`request`);
const fs = require(`fs`);
const local_scan = require('clamscan');
const crypto = require('crypto');
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
    dl_obj.db_pool.getConnection().then(async conn => {
        //var ignored_files = [`png`, `txt`, `gif`, `jpg`, `jpeg`, `tif`, `tiff`, `mp3`, `wav`, `avi`, `mpg`, `mpeg`, `webm`, `wmv`, `flv`, `mov`, `mp4`];
        var ignored_files = []


        await dl_obj.dc_msg.attachments.forEach(async attached => {
            var filename_check = attached.filename.split(".");
            if (ignored_files.includes(filename_check.slice(-1)[0])) {
                console.log(`Detected ${filename_check.slice(-1)[0]} file extension, marked safe -> Returning`);
                return;
            } else {
                dl_obj.url = attached.url
                await file_download(dl_obj)
            };

            async function file_download(dl_obj) {
                await request.get(dl_obj.url)
                    .on('error', console.error)
                    .pipe(await fs.createWriteStream(`./files/${attached.filename}`))

                function fileHash(filename, algorithm = 'sha256') {
                    return new Promise((resolve, reject) => {
                        let shasum = crypto.createHash(algorithm);
                        try {
                            let s = fs.createReadStream(filename)
                            s.on('data', function (data) {
                                shasum.update(data)
                            })
                            s.on('end', function () {
                                const hash = shasum.digest('hex')
                                return resolve(hash);
                            })
                        } catch (error) {
                            return reject('calc fail');
                        }
                    });
                }
                dl_obj.filesum = await fileHash(`./files/${attached.filename}`)
                await conn.query(`INSERT IGNORE INTO filehash (sha256sum, filename) VALUES ("${dl_obj.filesum}", "${attached.filename}")`).then(res => console.log(res))
                await file_scan(dl_obj)
                conn.end()
            };

            async function file_scan(dl_obj) {
                conn.query(`SELECT * FROM filehash WHERE sha256sum="${dl_obj.filesum}"`).then(response_hash => {
                    if (response_hash[0].filehash.clam_detection == undefined) {
                        clamavscan.then(async clamscan => {

                            console.log("Scanning File...")
                            var { is_infected, file, viruses } = await clamscan.is_infected(`./files/${attached.filename}`);
                            if (is_infected) {
                                console.log(`${file} is infected with ${viruses}!`);
                                conn.query(`UPDATE filehash SET clam_detection = 1 WHERE sha256sum = "${dl_obj.filesum}"`)
                                dl_obj.dc_msg.delete();
                                fs.unlinkSync(`./files/${attached.filename}`)
                            } else {
                                console.log(`File ${file} is clean.`);
                                conn.query(`UPDATE filehash SET clam_detection = 0 WHERE sha256sum = "${dl_obj.filesum}"`)
                                dl_obj.dc_msg.clearReactions();
                                fs.unlinkSync(`./files/${attached.filename}`)
                            }
                        }).catch(err => { console.log(err) });

                    } else {
                        if (response_hash[0].filehash.clam_detection == 1) {
                            console.log(`File with Hash ${dl_obj.filesum} already scanned, Infected`)
                            dl_obj.dc_msg.delete();
                            fs.unlinkSync(`./files/${attached.filename}`)
                        } else {
                            console.log(`File with Hash ${dl_obj.filesum} already scanned, Clean`)
                            dl_obj.dc_msg.clearReactions();
                            fs.unlinkSync(`./files/${attached.filename}`)
                        }

                    };
                });
            };
        });
    });
};