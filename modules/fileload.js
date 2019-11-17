const request = require(`request`);
const fs = require(`fs`);

module.exports.download = async function(dl_obj) {

    var ignored_files = [`png`, `txt`, `gif`]

    dl_obj.dc_msg.attachments.forEach(attached => {
        if (attached.filename === ignored_files) return
        else {
            file_download(attached.url)
        };

        function file_download(url) {
            request.get(url)
                .on('error', console.error)
                .pipe(fs.createWriteStream(`./files/${attached.filename}`));
        }
    });
}