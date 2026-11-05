var fs = require("fs");
var vm = require('vm')
var JSZip = require("jszip");

vm.runInThisContext(fs.readFileSync("defaults.js"))
vm.runInThisContext(fs.readFileSync("model.js"))

load_dataset("highresolution.csv.zip",function(result){
    tenyearsdatalines = result

    load_dataset("temperature.csv.zip",function(result) {
        temperaturelines = result
        run();
    });
});

function load_dataset(filename,callback) {
    fs.readFile(filename, function(err, data) {
        if (err) throw err;
            JSZip.loadAsync(data).then(function (zip) {
            zip.file(filename.replace(".zip","")).async("string")
            .then(function (content) {
                callback(content.split(/\r\n|\n/));
            });
        });
    });
}

function run() {
    model.init()
    model.run()
    console.log(o)
}

