function load_capacityfactor_dataset(filename,callback){
    // Load dataset as zip and decompress  - provides faster loading times
    tenyearsdatalines = []
    hours = 0
    
    JSZipUtils.getBinaryContent(filename, function(err, data) {
        if(err) {
        throw err; // or handle err
        }

        JSZip.loadAsync(data).then(function (zip) {
            zip.file(filename.replace(".zip","")).async("string")
            .then(function (capacityfactorfile) {
                tenyearsdatalines = capacityfactorfile.split(/\r\n|\n/);
                hours = 87648;
                callback(tenyearsdatalines);
            });
        });
        
    });
}

function load_temperature_dataset(filename,callback){
    // Load dataset as zip and decompress  - provides faster loading times
    temperaturelines = []
    days = 0
    
    JSZipUtils.getBinaryContent(filename, function(err, data) {
        if(err) {
        throw err; // or handle err
        }
        
        JSZip.loadAsync(data).then(function (zip) {
            zip.file(filename.replace(".zip","")).async("string")
            .then(function (temperaturefile) {
                temperaturelines = temperaturefile.split(/\r\n|\n/);
                days = temperaturelines.length;
                callback();
            });
        });
    });
}

function load_test_dataset(filename,callback){
    // Load dataset as zip and decompress  - provides faster loading times
    testlines = []
    
    JSZipUtils.getBinaryContent(filename, function(err, data) {
        if(err) {
        throw err; // or handle err
        }

        JSZip.loadAsync(data).then(function (zip) {
            zip.file(filename.replace(".zip","")).async("string")
            .then(function (testfile) {
                testlines = testfile.split(/\r\n|\n/);
                callback();
            });
        });
    });
}

var view = {
    start: 0,
    end: 0,
    interval: 0,
    
    pan_left: function () {
        var range = view.end - view.start;
        view.start -= range*0.25;
        view.end -= range*0.25;
    },
    
    pan_right: function () {
        var range = view.end - view.start;
        view.start += range*0.25;
        view.end += range*0.25;
    },
    
    zoom_in: function () {
        var range = view.end - view.start;
        var mid = view.start + range*0.5;
        view.start = mid - range*0.25;
        view.end = mid + range*0.25;
        this.calc_interval();
    },
    
    zoom_out: function () {
        var range = view.end - view.start;
        var mid = view.start + range*0.5;
        view.start = mid - range;
        view.end = mid + range;
        this.calc_interval();
    },
    
    calc_interval:function() {
        var npoints = 2400;
        var interval = Math.round((this.end - this.start)/npoints);
        
        /*
        var outinterval = 3600;
        if (interval>3600*1) outinterval = 3600*1;
        if (interval>3600*2) outinterval = 3600*2;
        if (interval>3600*3) outinterval = 3600*3;
        if (interval>3600*4) outinterval = 3600*4;
        if (interval>3600*5) outinterval = 3600*5;
        if (interval>3600*6) outinterval = 3600*6;
        if (interval>3600*12) outinterval = 3600*12;
        if (interval>3600*24) outinterval = 3600*24;
        
        this.interval = outinterval*/
        
        if (interval<3600) interval = 3600;
        this.interval = interval
        
        this.start = Math.floor(this.start / this.interval) * this.interval;
        this.end = Math.ceil(this.end / this.interval) * this.interval;
    }
}

function timeseries(data)
{
    if (data==undefined) return [];
    var datastarttime = 32*365.25*24*3600;
    var len = data.length;
    var ts = [];
    for (var time=view.start; time<view.end; time+=view.interval) {
        let pos = Math.floor((time-datastarttime)/3600);
        if (pos>=0 && pos<len) {
            ts.push([time*1000,data[pos]]);  
        }
    }
    return ts;
}
