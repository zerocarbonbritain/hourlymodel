var fs = require("fs");
var vm = require('vm')
var JSZip = require("jszip");

vm.runInThisContext(fs.readFileSync("../js/fullzcb3.js"))

hours = 87648;
datastarttime = 32*365.25*24*3600*1000;

load_dataset("highresolution.csv.zip",function(result){
    tenyearsdatalines = result
    load_dataset("temperature.csv.zip",function(result) {
        temperaturelines = result
        run();
    });
});

function load_dataset(filename,callback) {
    fs.readFile("../"+filename, function(err, data) {
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
    fullzcb3_init();
    fullzcb3_run();
}


