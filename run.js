var fs = require("fs");
var vm = require('vm')
var JSZip = require("jszip");

vm.runInThisContext(fs.readFileSync("defaults.js"))
vm.runInThisContext(fs.readFileSync("model.js"))

load_dataset("highresolution.csv.zip",function(result){
    tenyearsdatalines = result

    // Prepare capacity factor dataset
    capacityfactors_all = [];
    for (var hour = 0; hour < 87648; hour++) {
        var capacityfactors = tenyearsdatalines[hour].split(",");
        for (var x=0; x<capacityfactors.length; x++) {
            capacityfactors[x] = parseFloat(capacityfactors[x]);
        }
        capacityfactors_all.push(capacityfactors)
    }
    
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

