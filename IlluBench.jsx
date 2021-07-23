/*
    Adobe Illustrator Benchmark script
    MarkN 2021
    visual-meaning.com

    WIP

    * What does meaningful benchmark data look like?
        - each test isolates a different class of operation
        - account for noise and outliers in the results... 
        - track effect factors
            ^ number of times benchmark has been run since starting the app (does it improve with time?)
            ^ what factors contribute to time delta? How to minimise?
    * What's the best way to get it? Whilst not out-staying its welcome!
        - complexity of task vs terations of test
            ^ One complex operation per test 
            ^ multiple less complex operations per test, averaging results (how many?)

    TODO: 
        Design results display
        Design data file
            storing info - (per run? or global? or both?)
            storing results
        reading data file back in
            analytics
*/

if (!Date.prototype.toISOString) {
    (function() {
        function pad(number) {
            if (number < 10) {
                return "0" + number;
            }
            return number;
        }

        Date.prototype.toISOString = function() {
            return (
                this.getUTCFullYear() + //YYYY-MM-DD HH:MM:SS:MM
                "-" +
                pad(this.getUTCMonth() + 1) +
                "-" +
                pad(this.getUTCDate()) +
                " " +
                pad(this.getUTCHours()) +
                ":" +
                pad(this.getUTCMinutes()) +
                ":" +
                pad(this.getUTCSeconds())
                //  +
                // "." +
                // (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5)
            );
        };
    })();
}

//_______ Main

main();

function main(runs) {
    var docName = "Illustrator Benchmark Doc.ai";
    var doc = getDoc(docName); //try and get a saved doc (with a path), or an unsaved one if prefered. 

    var csvFilename = "Illustrator Benchmark Data.csv";
    var csvContents = doc.path ?
        getCSVContentsAsArray(doc.path + "/" + csvFilename) :
        false; //if there's an appropriately named csv file already in this location, get the contents 
    var pastData = csvContents ? 
        getDataFromCsvContents(csvContents) : 
        false;


    var runCount = runs | 0;
    //var pastResults = getPastResults(); //average, mean, time delta, highest on record for individual tests and totals

    //var info = infoIU(pastResults); //factors that might affect the results - to append to the results for this run

    //if (!info) {
    //    return
   // }

   // var doc = app.documents.add();
    app.executeMenuCommand('doc-color-rgb'); //TODO might be interesting to compare results in CYMK!

    var obj = doc.groupItems.add(); //The art item we'll add complexity to in the tests, to see what kind of impact it has on the benchmark

    var tests = []; //each test to come back as an object containing time and a score

    var progress = progressWindow(); //in case you're wondering what's going on

    // Run the tests

    tests[0] = funcTimer(function() {
        return rectanglesTest(obj, progress)
    });
    tests[1] = funcTimer(function() {
        return transformationsTest(obj, progress)
    });
    tests[2] = funcTimer(function() {
        return effectsTest(obj, progress)
    });
    tests[3] = funcTimer(function() {
        return zoomTest(doc, progress)
    });
    tests[4] = funcTimer(function() {
        return fileWriteTest(doc, progress)
    });

    // Tell us what happened

    var testTotals = sumTests(tests); //total time and score for this test

    recordResults(tests, testTotals, pastResults, info); //write time/score & info to illuBench record.txt file

    progress(false);

    displayResuts(tests, testTotals, pastResults, info, runCount); //Tell us what happened

    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
};

function getDoc(docName){
    var doc;

    if(app.activeDocument){ //doc open?
        if(doc.name == docName){ //right name?
            return doc;
        }
    } 
    doc = app.documents.add(); //new doc then
    doc.name = docName;

    var path = Folder.selectDialog( //where to save it...
        "The benchmark needs to make a new document to run in.\
         \nPlease choose a location to save it. \
         \rIf you select a folder, the script will automatically\
         \nsave the results to a CSV file in that same location.\
         \rRunning the benchmark additional times from the same\
         \ndocument will append entries to the CSV file\
         \nfor you to analyse in Excel.\
         \rIf you click cancel, you can still run the benchmark but\
         \nthe results won't be saved.", $.HOMEPATH);
    if( !path || path == null || !saveLocation.exists ){
        return doc; //oh, not saving it then...
    }
    var file = new File(path + "/" + docName + ".ai"); 
    
    // Preflight access rights
	if (file.open("w")) {
		file.close();
        doc.saveAs( file, new IllustratorSaveOptions());
	}
	else {
		throw new Error('Access is denied');
	}

    return doc; //here's a doc that has been saved (ie. it has a path)
}

function getCSVContentsAsArray( fullPath ){
    var csvFile = File( fullPath );
    if(!csvFile.exists){
        return false;
    }
    csvFile.encoding = 'UTF8',
    csvFile.lineFeed = 'Windows'; //TODO for mac??
    csvFile.open('r',undefined,undefined);
    return csvFile.read();
}

function getDataFromCsvContents( arr ){//return some sort of data structure for past results
    var contents = arr;
    var results = [];// will hold the data 
    var rows = contents.split('\n');
    var keys = rows[0].split('\t'); // get the heads 
    for(var i = 1; i < rows.length; i++){ 
        var obj = {}; // temp object
        var cells = rows[i].split(':.:');// get the cells
        // assign them to the heads
        obj[keys[0]] = cells[0]; // computer
        obj[keys[1]] = cells[1]; // filename
        obj[keys[2]] = cells[2]; // location
        obj[keys[3]] = cells[3]; // parentFolder
        obj[keys[4]] = cells[4]; // gifFolder

        results.push(obj); // add to data
    }       

    for(var i = 0; i < results.length; i++){
        if(results[i].computer == $.getenv("COMPUTERNAME")){// Actually let's try asuming that ai folders in the same folder should share the same export settings && results[i].filename == doc.name){ 
            location = results[i].location;
            parentFolder = results[i].parentFolder;
            gifFolder = results[i].gifFolder;
        }
    }
    return results[];
}

function getPastResults() {
    //read from file - from the set of all past file runs
    var vars = {
        totals: {
            average: 0,
            mean: 0,
            timeDelta: 0,
            recordTime: 0,
            recordScore: 0
        },
        rectangles: {
            average: 0,
            mean: 0,
            timeDelta: 0,
            recordTime: 0,
            recordScore: 0
        },
        transformations: {
            average: 0,
            mean: 0,
            timeDelta: 0,
            recordTime: 0,
            recordScore: 0
        },
        effects: {
            average: 0,
            mean: 0,
            timeDelta: 0,
            recordTime: 0,
            recordScore: 0
        },
        zoom: {
            average: 0,
            mean: 0,
            timeDelta: 0,
            recordTime: 0,
            recordScore: 0
        },
        fileWrite: {
            average: 0,
            mean: 0,
            timeDelta: 0,
            recordTime: 0,
            recordScore: 0
        }
    }
    return vars; //average, mean, time delta, highest on record for individual tests and totals
}

function sumTests(tests) {
    var totals = {
        time: 0,
        score: 0
    }
    for (var i = 0; i < tests.length; i++) { //sum the total time and scores from all the tests
        totals.time += tests[i].time;
        totals.score += tests[i].score | 0;
    }
    return totals;
}

function funcTimer(benchTest) { //executes tests, returns time and score
    var vars = {
        name: "",
        time: 0,
        score: 0
    }

    var start = new Date().getTime();

    vars.name = benchTest();

    var end = new Date().getTime();

    vars.time = end - start;
    vars.score = score(vars.time);
    return vars;
}

function score(time) {
    var scale = 5000000; //arbitary, but hopefully interesting for comparison
    if (time <= 1) {
        return false; //doh... 
    }
    return Math.round((1 / time) * scale );
    //return "--- time: " + time + ", 1/time: " + 1/time + ", 1/time *30000: " + (1/time) *30000;
}

function recordResults(tests, testTotals, pastResults, info) {
    //write results to file

}

/* _____________________ Tests _________________________
   _____________________________________________________ 
   Do a particular type of operation in a regular, sufficiently-
   complex-to-take-a-few-seconds-to-complete sort of way, return test name
   */

//______ TEST 1
function rectanglesTest(obj, progress) {
    var doc = obj.layer.parent;
    var rects = [];
    progress("Rectangles test");

    for (var i = 0; i < 40; i++) {
        rects[i] = [];
        for (var j = 0; j < 80; j++) {
            rects[i][j] = doc.pathItems.rectangle(-3, 3, 4, 4);
            rects[i][j].move(obj, ElementPlacement.PLACEATEND);
            rects[i][j].translate(j + (i * 7), j * 4);
            rects[i][j].fillColor.red = rects[i][j].strokeColor.blue = 20 + (Math.round(Math.random() * 70));
            rects[i][j].fillColor.green = rects[i][j].strokeColor.red = 90 + (Math.round(Math.random() * 65));
            rects[i][j].fillColor.blue = rects[i][j].strokeColor.green = 160 + (Math.round(Math.random() * 30));
        }
    }
    centreObj(obj);

    app.redraw();
    return "Rectangles test";
}

//______ TEST 2 
function transformationsTest(obj, progress) {

    progress("Transformations test");

    for (var i = 0; i < obj.pageItems.length; i++) { // 220,000 points
        //rotate
        obj.pageItems[i].rotate(i * 2);
        obj.pageItems[i].resize(111, 188);
  //      obj.pageItems[i].translate(0.03 * i, 0.05 * i);
        //obj.pageItems[i].zOrder( ZOrderMethod.BRINGFORWARD ); //Is going to mutate the obj.pageItems order while we iterate through it? Not sure...
    }
    centreObj(obj);
    app.redraw();
    return "Transformations test";
}

//______ TEST 3
function effectsTest(obj, progress) {
    progress("Effects test");
    /*Thanks m1b, femkeblanco, Silly-V, CarlosCanto 
    https://community.adobe.com/t5/illustrator/pageitem-applyeffect-liveeffectxml/m-p/7315221
    https://community.adobe.com/t5/illustrator/scripting-live-effects/m-p/11744702 
    https://github.com/mark1bean/ai-live-effect-functions/blob/master/README.md
    */
    var i=0;
    var efct = '<LiveEffect name="Adobe Deform"><Dict data="R DeformValue 0.45 R DeformVert 0 B Rotate 0 I DeformStyle 1 R DeformHoriz 0 "/></LiveEffect>';

    // (function(){ 
    //     return '<LiveEffect name="Adobe Deform"><Dict data="R DeformValue '+0.45+' R DeformVert 0 B Rotate 0 I DeformStyle 1 R DeformHoriz 0 "/></LiveEffect>';
    // });

    for ( var i = 0; i < obj.pageItems.length; i+=25) { 
        obj.pageItems[i].applyEffect(efct);
        app.redraw();
    }  

    obj.applyEffect(efct);

    app.redraw();
    return "Effects test";
}

//______ TEST 4
function zoomTest(doc, progress) {
    app.redraw();
    progress("Zoom test");
    var view = doc.views[0];
    view.zoom = 1;

    for (var a = 1; a > 0.3; a -= 0.01) {
        view.zoom = a;
        app.redraw();
    }
    app.redraw();
    for (var a = 0.3; a <= 1; a += 0.01) {
        view.zoom = a;
        app.redraw();
    }
    app.redraw();
    return "Zoom test";
}

//______ TEST 5
function fileWriteTest(doc, progress) {
    progress("File write test");
    //write a few files, delete files

    return "File write test";
}

function centreObj(obj) {
    var doc = obj.layer.parent;
    var activeAB = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var artboardRight = activeAB.artboardRect[0] + activeAB.artboardRect[2];
    var artboardBottom = activeAB.artboardRect[1] + activeAB.artboardRect[3];
    var horziontalCenterPosition = (artboardRight - obj.width) / 2;
    var verticalCenterPosition = (artboardBottom + obj.height) / 2;

    obj.position = [horziontalCenterPosition, verticalCenterPosition];
    
    app.redraw();
}

//_____________PROGRESS WINDOW UI
//_________________________________________
//_________________________________________
//_________________________________________
//_________________________________________

function progressWindow() {
    var dialog = new Window("window");
    dialog.text = "Export Progress";
    dialog.orientation = "column";
    dialog.alignChildren = ["left", "top"];
    dialog.spacing = 10;
    dialog.margins = 16;
    dialog.onClick = function() {
        dialog.close();
    };

    var stage = dialog.add("statictext", undefined, undefined, {
        name: "stage"
    });
    stage.text = "Stage: ";
    stage.preferredSize.width = 465;

    return function _updateText(text) {
        if (!dialog) {
            return;
        }
        if (!text) {
            dialog.close();
            return;
        }
        dialog.show();
        stage.text = text;
        dialog.update();
    };
}

//_____________ INFO UI
//_________________________________________
//_________________________________________
//_________________________________________
//_________________________________________


function infoIU() { //What factors might be contributing to the benchmark times?
    var date = new Date();
    var vars = {
        date: date.toISOString(),
        otherDocs: false,
        otherApps: false,
        optimisationApp: false,
        illuVersion: app.version,
        os: $.os,
        screens: $.screens.length, //number of displays? TODO - calculate resolutions (left,top,right,bottom)
        cpu: $.getenv("PROCESSOR_IDENTIFIER"),
        threads: $.getenv("NUMBER_OF_PROCESSORS")
    };

    //https://scriptui.joonas.me <- praise
    var dialog = new Window("dialog");
    dialog.text = "Illustrator Benchmark ";
    dialog.orientation = "row";
    dialog.alignChildren = ["center", "top"];
    dialog.spacing = 10;
    dialog.margins = 16;

    // GROUP1
    // ======
    var group1 = dialog.add("group", undefined, {
        name: "group1"
    });
    group1.orientation = "column";
    group1.alignChildren = ["left", "center"];
    group1.spacing = 10;
    group1.margins = 0;

    // GROUP2
    // ======
    var group2 = group1.add("group", undefined, {
        name: "group2"
    });
    group2.orientation = "row";
    group2.alignChildren = ["right", "center"];
    group2.spacing = 10;
    group2.margins = 0;
    group2.alignment = ["fill", "center"];

    var statictext1 = group2.add("statictext", undefined, undefined, {
        name: "statictext1"
    });
    statictext1.text = "Date: ";
    statictext1.justify = "right";

    // GROUP3
    // ======
    var group3 = group2.add("group", undefined, {
        name: "group3"
    });
    group3.preferredSize.width = 225;
    group3.orientation = "row";
    group3.alignChildren = ["left", "top"];
    group3.spacing = 10;
    group3.margins = 2;

    var button1 = group2.add("button", undefined, undefined, {
        name: "button1"
    });
    button1.text = "Info";

    // PANEL1
    // ======
    var panel1 = group1.add("panel", undefined, undefined, {
        name: "panel1"
    });
    panel1.text = "Factors that might affect test results:";
    panel1.orientation = "row";
    panel1.alignChildren = ["left", "top"];
    panel1.spacing = 10;
    panel1.margins = 10;

    // GROUP4
    // ======
    var group4 = panel1.add("group", undefined, {
        name: "group4"
    });
    group4.orientation = "column";
    group4.alignChildren = ["left", "center"];
    group4.spacing = 10;
    group4.margins = 0;

    // GROUP5
    // ======
    var group5 = group4.add("group", undefined, {
        name: "group5"
    });
    group5.orientation = "row";
    group5.alignChildren = ["left", "center"];
    group5.spacing = 10;
    group5.margins = 0;

    var checkbox1 = group5.add("checkbox", undefined, undefined, {
        name: "checkbox1"
    });
    checkbox1.text = "Are other files currently open in Illustrator?";

    // GROUP6
    // ======
    var group6 = group4.add("group", undefined, {
        name: "group6"
    });
    group6.orientation = "row";
    group6.alignChildren = ["left", "center"];
    group6.spacing = 10;
    group6.margins = 0;

    var checkbox2 = group6.add("checkbox", undefined, undefined, {
        name: "checkbox2"
    });
    checkbox2.text = "Have you bothered closing all other apps?";

    // GROUP7
    // ======
    var group7 = group4.add("group", undefined, {
        name: "group7"
    });
    group7.orientation = "row";
    group7.alignChildren = ["left", "center"];
    group7.spacing = 10;
    group7.margins = 0;

    var checkbox3 = group7.add("checkbox", undefined, undefined, {
        name: "checkbox3"
    });
    checkbox3.helpTip = "eg. Process Lasso, CPUCores etc.";
    checkbox3.text = "Is there a process optimisation app running?";

    // GROUP4
    // ======
    var divider1 = group4.add("panel", undefined, undefined, {
        name: "divider1"
    });
    divider1.alignment = "fill";

    // GROUP8
    // ======
    var group8 = group4.add("group", undefined, {
        name: "group8"
    });
    group8.orientation = "row";
    group8.alignChildren = ["left", "center"];
    group8.spacing = 10;
    group8.margins = 0;

    var statictext2 = group8.add("statictext", undefined, undefined, {
        name: "statictext2"
    });
    statictext2.text = "Illustrator version:";

    var statictext3 = group8.add("statictext", undefined, undefined, {
        name: "statictext3"
    });
    statictext3.text = "\u0022\u0022";

    // GROUP9
    // ======
    var group9 = group4.add("group", undefined, {
        name: "group9"
    });
    group9.orientation = "row";
    group9.alignChildren = ["left", "center"];
    group9.spacing = 10;
    group9.margins = 0;

    var statictext4 = group9.add("statictext", undefined, undefined, {
        name: "statictext4"
    });
    statictext4.text = "Operating system:";

    var statictext5 = group9.add("statictext", undefined, undefined, {
        name: "statictext5"
    });
    statictext5.text = "\u0022\u0022";

    // GROUP10
    // =======
    var group10 = group4.add("group", undefined, {
        name: "group10"
    });
    group10.orientation = "row";
    group10.alignChildren = ["left", "center"];
    group10.spacing = 10;
    group10.margins = 0;

    var statictext6 = group10.add("statictext", undefined, undefined, {
        name: "statictext6"
    });
    statictext6.text = "Screens:";

    var statictext7 = group10.add("statictext", undefined, undefined, {
        name: "statictext7"
    });
    statictext7.text = "\u0022\u0022";

    // GROUP11
    // =======
    var group11 = group4.add("group", undefined, {
        name: "group11"
    });
    group11.orientation = "row";
    group11.alignChildren = ["left", "center"];
    group11.spacing = 10;
    group11.margins = 0;

    var statictext8 = group11.add("statictext", undefined, undefined, {
        name: "statictext8"
    });
    statictext8.text = "Processor Identifier:";

    var statictext9 = group11.add("statictext", undefined, undefined, {
        name: "statictext9"
    });
    statictext9.text = "\u0022\u0022";

    // GROUP12
    // =======
    var group12 = group4.add("group", undefined, {
        name: "group12"
    });
    group12.orientation = "row";
    group12.alignChildren = ["left", "center"];
    group12.spacing = 10;
    group12.margins = 0;

    var statictext10 = group12.add("statictext", undefined, undefined, {
        name: "statictext10"
    });
    statictext10.text = "Number of Processors:";

    var statictext11 = group12.add("statictext", undefined, undefined, {
        name: "statictext11"
    });
    statictext11.text = "\u0022\u0022";

    // GROUP4
    // ======
    var divider2 = group4.add("panel", undefined, undefined, {
        name: "divider2"
    });
    divider2.alignment = "fill";

    var edittext1 = group4.add('edittext {properties: {name: "edittext1", multiline: true, scrollable: true}}');
    edittext1.text = "Note";
    edittext1.preferredSize.height = 79;
    edittext1.alignment = ["fill", "center"];

    // PANEL1
    // ======
    var divider3 = panel1.add("panel", undefined, undefined, {
        name: "divider3"
    });
    divider3.alignment = "fill";

    // GROUP13
    // =======
    var group13 = panel1.add("group", undefined, {
        name: "group13"
    });
    group13.orientation = "column";
    group13.alignChildren = ["fill", "center"];
    group13.spacing = 10;
    group13.margins = 0;

    var statictext12 = group13.add("statictext", undefined, undefined, {
        name: "statictext12"
    });
    statictext12.helpTip = "This might be interested if you're overclocking or changing hardware";
    statictext12.text = "Hardware";
    statictext12.preferredSize.width = 250;
    statictext12.justify = "center";
    statictext12.alignment = ["center", "center"];

    // GROUP14
    // =======
    var group14 = group13.add("group", undefined, {
        name: "group14"
    });
    group14.orientation = "row";
    group14.alignChildren = ["left", "center"];
    group14.spacing = 10;
    group14.margins = 0;
    group14.alignment = ["left", "center"];

    var statictext13 = group14.add("statictext", undefined, undefined, {
        name: "statictext13"
    });
    statictext13.helpTip = "eg. 8600k";
    statictext13.text = "CPU name";

    var edittext2 = group14.add('edittext {properties: {name: "edittext2"}}');
    edittext2.alignment = ["left", "fill"];

    // GROUP15
    // =======
    var group15 = group13.add("group", undefined, {
        name: "group15"
    });
    group15.orientation = "row";
    group15.alignChildren = ["left", "center"];
    group15.spacing = 10;
    group15.margins = 0;

    var statictext14 = group15.add("statictext", undefined, undefined, {
        name: "statictext14"
    });
    statictext14.helpTip = "eg.  4800";
    statictext14.text = "CPU Mhz";

    var edittext3 = group15.add('edittext {properties: {name: "edittext3"}}');

    // GROUP16
    // =======
    var group16 = group13.add("group", undefined, {
        name: "group16"
    });
    group16.orientation = "row";
    group16.alignChildren = ["left", "center"];
    group16.spacing = 10;
    group16.margins = 0;

    var statictext15 = group16.add("statictext", undefined, undefined, {
        name: "statictext15"
    });
    statictext15.helpTip = "eg. 16";
    statictext15.text = "RAM GB";

    var edittext4 = group16.add('edittext {properties: {name: "edittext4"}}');

    // GROUP17
    // =======
    var group17 = group13.add("group", undefined, {
        name: "group17"
    });
    group17.orientation = "row";
    group17.alignChildren = ["left", "center"];
    group17.spacing = 10;
    group17.margins = 0;

    var statictext16 = group17.add("statictext", undefined, undefined, {
        name: "statictext16"
    });
    statictext16.helpTip = "eg. 2133";
    statictext16.text = "RAM Mhz";

    var edittext5 = group17.add('edittext {properties: {name: "edittext5"}}');

    // GROUP18
    // =======
    var group18 = group13.add("group", undefined, {
        name: "group18"
    });
    group18.orientation = "row";
    group18.alignChildren = ["left", "center"];
    group18.spacing = 10;
    group18.margins = 0;

    var statictext17 = group18.add("statictext", undefined, undefined, {
        name: "statictext17"
    });
    statictext17.helpTip = "eg. GTX 1070 ti";
    statictext17.text = "GPU name";

    var edittext6 = group18.add('edittext {properties: {name: "edittext6"}}');

    // GROUP19
    // =======
    var group19 = group13.add("group", undefined, {
        name: "group19"
    });
    group19.orientation = "row";
    group19.alignChildren = ["left", "center"];
    group19.spacing = 10;
    group19.margins = 0;

    var statictext18 = group19.add("statictext", undefined, undefined, {
        name: "statictext18"
    });
    statictext18.helpTip = "eg. 1683";
    statictext18.text = "GPU Mhz";

    var edittext7 = group19.add('edittext {properties: {name: "edittext7"}}');

    // GROUP20
    // =======
    var group20 = group13.add("group", undefined, {
        name: "group20"
    });
    group20.orientation = "row";
    group20.alignChildren = ["left", "center"];
    group20.spacing = 10;
    group20.margins = 0;

    var statictext19 = group20.add("statictext", undefined, undefined, {
        name: "statictext19"
    });
    statictext19.helpTip = "eg. 8";
    statictext19.text = "GPU RAM GB";

    var edittext8 = group20.add('edittext {properties: {name: "edittext8"}}');

    // GROUP21
    // =======
    var group21 = group13.add("group", undefined, {
        name: "group21"
    });
    group21.orientation = "column";
    group21.alignChildren = ["left", "center"];
    group21.spacing = 10;
    group21.margins = 0;

    var statictext20 = group21.add("statictext", undefined, undefined, {
        name: "statictext20"
    });
    statictext20.helpTip = "eg. 8";
    statictext20.text = "Storage";

    var radiobutton1 = group21.add("radiobutton", undefined, undefined, {
        name: "radiobutton1"
    });
    radiobutton1.text = "HD";

    var radiobutton2 = group21.add("radiobutton", undefined, undefined, {
        name: "radiobutton2"
    });
    radiobutton2.text = "SSD";

    var radiobutton3 = group21.add("radiobutton", undefined, undefined, {
        name: "radiobutton3"
    });
    radiobutton3.text = "NVMe";

    // GROUP22
    // =======
    var group22 = group1.add("group", undefined, {
        name: "group22"
    });
    group22.orientation = "row";
    group22.alignChildren = ["left", "center"];
    group22.spacing = 10;
    group22.margins = 0;
    group22.alignment = ["fill", "center"];

    var button2 = group22.add("button", undefined, undefined, {
        name: "button2"
    });
    button2.text = "Benchmark";

    var button3 = group22.add("button", undefined, undefined, {
        name: "button3"
    });
    button3.text = "Cancel";

    //dialog.show();

    return vars; // {all the things}
}


//_____________DISPLAY RESULTS UI
//_________________________________________
//_________________________________________
//_________________________________________
//_________________________________________


function displayResults(tests, results, pastResults, info, runCount) {
    //https://scriptui.joonas.me <- praise

    // BENCHRESULTSWIN
    // ===============
    var benchResultsWin = new Window("dialog"); 
        benchResultsWin.text = "Benchmark Results"; 
        benchResultsWin.orientation = "column"; 
        benchResultsWin.alignChildren = ["center","top"]; 
        benchResultsWin.spacing = 10; 
        benchResultsWin.margins = 16; 

    // TPANEL1
    // =======
    var tpanel1 = benchResultsWin.add("tabbedpanel", undefined, undefined, {name: "tpanel1"}); 
        tpanel1.alignChildren = "fill"; 
        tpanel1.preferredSize.width = 451; 
        tpanel1.margins = 0; 

    // THISTESTTAB
    // ===========
    var thisTestTab = tpanel1.add("tab", undefined, undefined, {name: "thisTestTab"}); 
        thisTestTab.text = "This test"; 
        thisTestTab.orientation = "row"; 
        thisTestTab.alignChildren = ["left","top"]; 
        thisTestTab.spacing = 10; 
        thisTestTab.margins = 10; 

    // TESTRESULTSGROUP
    // ================
    var testResultsGroup = thisTestTab.add("group", undefined, {name: "testResultsGroup"}); 
        testResultsGroup.orientation = "column"; 
        testResultsGroup.alignChildren = ["fill","top"]; 
        testResultsGroup.spacing = 10; 
        testResultsGroup.margins = 0; 
        testResultsGroup.alignment = ["left","fill"]; 

    var testDateText = testResultsGroup.add("statictext", undefined, undefined, {name: "testDateText"}); 
        testDateText.text = "Date: " + info.date; 

    // TESTRECTPANEL
    // =============
    var testRectPanel = testResultsGroup.add("panel", undefined, undefined, {name: "testRectPanel"}); 
        testRectPanel.text = "1: Rectangles"; 
        testRectPanel.orientation = "row"; 
        testRectPanel.alignChildren = ["left","top"]; 
        testRectPanel.spacing = 10; 
        testRectPanel.margins = 10; 

    var statictext1 = testRectPanel.add("statictext", undefined, undefined, {name: "statictext1"}); 
        statictext1.text = "Time: "; 

    var rectTimeText = testRectPanel.add("statictext", undefined, undefined, {name: "rectTimeText"}); 
    rectTimeText.text = tests[0].time;

    var statictext2 = testRectPanel.add("statictext", undefined, undefined, {name: "statictext2"}); 
        statictext2.text = "Score:"; 

    var rectScoreText = testRectPanel.add("statictext", undefined, undefined, {name: "rectScoreText"}); 
    rectScoreText.text = tests[0].score;

    // TESTTRANSPANEL
    // ==============
    var testTransPanel = testResultsGroup.add("panel", undefined, undefined, {name: "testTransPanel"}); 
        testTransPanel.text = "2:  Transformations"; 
        testTransPanel.orientation = "row"; 
        testTransPanel.alignChildren = ["left","top"]; 
        testTransPanel.spacing = 10; 
        testTransPanel.margins = 10; 

    var statictext3 = testTransPanel.add("statictext", undefined, undefined, {name: "statictext3"}); 
        statictext3.text = "Time: "; 

    var transTimeText = testTransPanel.add("statictext", undefined, undefined, {name: "transTimeText"}); 
    transTimeText.text = tests[1].time;

    var statictext4 = testTransPanel.add("statictext", undefined, undefined, {name: "statictext4"}); 
        statictext4.text = "Score:"; 

    var transScoreText = testTransPanel.add("statictext", undefined, undefined, {name: "transScoreText"}); 
    transScoreText.text = tests[1].score;

    // TESTEFFPANEL
    // ============
    var testEffPanel = testResultsGroup.add("panel", undefined, undefined, {name: "testEffPanel"}); 
        testEffPanel.text = "3:  Effects"; 
        testEffPanel.orientation = "row"; 
        testEffPanel.alignChildren = ["left","top"]; 
        testEffPanel.spacing = 10; 
        testEffPanel.margins = 10; 

    var statictext5 = testEffPanel.add("statictext", undefined, undefined, {name: "statictext5"}); 
        statictext5.text = "Time: "; 

    var effTimeText = testEffPanel.add("statictext", undefined, undefined, {name: "effTimeText"}); 
    effTimeText.text = tests[2].time;

    var statictext6 = testEffPanel.add("statictext", undefined, undefined, {name: "statictext6"}); 
        statictext6.text = "Score:"; 

    var effScoreText = testEffPanel.add("statictext", undefined, undefined, {name: "effScoreText"}); 
    effScoreText.text = tests[2].score;

    // TESTZOOMPANEL
    // =============
    var testZoomPanel = testResultsGroup.add("panel", undefined, undefined, {name: "testZoomPanel"}); 
        testZoomPanel.text = "4: Zooms"; 
        testZoomPanel.orientation = "row"; 
        testZoomPanel.alignChildren = ["left","top"]; 
        testZoomPanel.spacing = 10; 
        testZoomPanel.margins = 10; 

    var statictext7 = testZoomPanel.add("statictext", undefined, undefined, {name: "statictext7"}); 
        statictext7.text = "Time: "; 

    var zoomTimeText = testZoomPanel.add("statictext", undefined, undefined, {name: "zoomTimeText"}); 
    zoomTimeText.text = tests[3].time;

    var statictext8 = testZoomPanel.add("statictext", undefined, undefined, {name: "statictext8"}); 
        statictext8.text = "Score:"; 

    var zoomScoreText = testZoomPanel.add("statictext", undefined, undefined, {name: "zoomScoreText"}); 
    zoomScoreText.text = tests[3].score;

    // TESTFILEPANEL
    // =============
    var testFilePanel = testResultsGroup.add("panel", undefined, undefined, {name: "testFilePanel"}); 
        testFilePanel.text = "5: File writes"; 
        testFilePanel.orientation = "row"; 
        testFilePanel.alignChildren = ["left","top"]; 
        testFilePanel.spacing = 10; 
        testFilePanel.margins = 10; 

    var statictext9 = testFilePanel.add("statictext", undefined, undefined, {name: "statictext9"}); 
        statictext9.text = "Time: "; 

    var fileTimeText = testFilePanel.add("statictext", undefined, undefined, {name: "fileTimeText"}); 
    fileTimeText.text = tests[4].time;

    var statictext10 = testFilePanel.add("statictext", undefined, undefined, {name: "statictext10"}); 
        statictext10.text = "Score:"; 

    var fileScoreText = testFilePanel.add("statictext", undefined, undefined, {name: "fileScoreText"}); 
    fileScoreText.text = tests[4].score;


    // TESTRESULTSGROUP
    // ================
    var divider1 = testResultsGroup.add("panel", undefined, undefined, {name: "divider1"}); 
        divider1.alignment = "fill"; 

    // TOTALPANEL
    // ==========
    var totalPanel = testResultsGroup.add("panel", undefined, undefined, {name: "totalPanel"}); 
        totalPanel.text = "Total"; 
        totalPanel.orientation = "row"; 
        totalPanel.alignChildren = ["left","top"]; 
        totalPanel.spacing = 10; 
        totalPanel.margins = 33; 

    var statictext11 = totalPanel.add("statictext", undefined, undefined, {name: "statictext11"}); 
        statictext11.text = "Time: "; 

    var totalTimeText = totalPanel.add("statictext", undefined, undefined, {name: "totalTimeText"}); 
    totalTimeText.text = results.time;

    var statictext12 = totalPanel.add("statictext", undefined, undefined, {name: "statictext12"}); 
        statictext12.text = "Score:"; 

    var totalScoreText = totalPanel.add("statictext", undefined, undefined, {name: "totalScoreText"}); 
    totalScoreText.text = results.score;

    // THISTESTTAB
    // ===========
    var divider2 = thisTestTab.add("panel", undefined, undefined, {name: "divider2"}); 
        divider2.alignment = "fill"; 

    // INFOGROUP
    // =========
    var infoGroup = thisTestTab.add("group", undefined, {name: "infoGroup"}); 
        infoGroup.orientation = "column"; 
        infoGroup.alignChildren = ["left","top"]; 
        infoGroup.spacing = 10; 
        infoGroup.margins = 0; 
        infoGroup.alignment = ["left","fill"]; 

    var infoText = infoGroup.add("statictext", undefined, undefined, {name: "infoText", multiline: true}); 
        infoText.text = "Test info:"; 
        infoText.alignment = ["left","top"]; 

    // AVERAGESANDHIGHSTAB
    // ===================
    var averagesAndHighsTab = tpanel1.add("tab", undefined, undefined, {name: "averagesAndHighsTab"}); 
        averagesAndHighsTab.text = "Averages and highs"; 
        averagesAndHighsTab.orientation = "row"; 
        averagesAndHighsTab.alignChildren = ["left","top"]; 
        averagesAndHighsTab.spacing = 10; 
        averagesAndHighsTab.margins = 10; 

    // TPANEL1
    // =======
    tpanel1.selection = thisTestTab; 

    // AVERAGESBREAKDOWNPANEL
    // ======================
    var averagesBreakdownPanel = averagesAndHighsTab.add("group", undefined, {name: "averagesBreakdownPanel"}); 
        averagesBreakdownPanel.orientation = "column"; 
        averagesBreakdownPanel.alignChildren = ["fill","center"]; 
        averagesBreakdownPanel.spacing = 10; 
        averagesBreakdownPanel.margins = 0; 

    var averagesText = averagesBreakdownPanel.add("statictext", undefined, undefined, {name: "averagesText"}); 
        averagesText.text = "Averages"; 

    // AVGRECTPANEL
    // ============
    var avgRectPanel = averagesBreakdownPanel.add("panel", undefined, undefined, {name: "avgRectPanel"}); 
        avgRectPanel.text = "1: Rectangles"; 
        avgRectPanel.orientation = "row"; 
        avgRectPanel.alignChildren = ["left","top"]; 
        avgRectPanel.spacing = 10; 
        avgRectPanel.margins = 10; 

    var statictext13 = avgRectPanel.add("statictext", undefined, undefined, {name: "statictext13"}); 
        statictext13.text = "Time: "; 

    var avRectTimeText = avgRectPanel.add("statictext", undefined, undefined, {name: "avRectTimeText"}); 

    var statictext14 = avgRectPanel.add("statictext", undefined, undefined, {name: "statictext14"}); 
        statictext14.text = "Score:"; 

    var avRectScoreText = avgRectPanel.add("statictext", undefined, undefined, {name: "avRectScoreText"}); 

    // AVGTRANSPANEL
    // =============
    var avgTransPanel = averagesBreakdownPanel.add("panel", undefined, undefined, {name: "avgTransPanel"}); 
        avgTransPanel.text = "2:  Transformations "; 
        avgTransPanel.orientation = "row"; 
        avgTransPanel.alignChildren = ["left","top"]; 
        avgTransPanel.spacing = 10; 
        avgTransPanel.margins = 10; 

    var statictext15 = avgTransPanel.add("statictext", undefined, undefined, {name: "statictext15"}); 
        statictext15.text = "Time: "; 

    var avTransTimeText = avgTransPanel.add("statictext", undefined, undefined, {name: "avTransTimeText"}); 

    var statictext16 = avgTransPanel.add("statictext", undefined, undefined, {name: "statictext16"}); 
        statictext16.text = "Score:"; 

    var avTransScoreText = avgTransPanel.add("statictext", undefined, undefined, {name: "avTransScoreText"}); 

    // AVGEFFPANEL
    // ===========
    var avgEffPanel = averagesBreakdownPanel.add("panel", undefined, undefined, {name: "avgEffPanel"}); 
        avgEffPanel.text = "3:  Effects "; 
        avgEffPanel.orientation = "row"; 
        avgEffPanel.alignChildren = ["left","top"]; 
        avgEffPanel.spacing = 10; 
        avgEffPanel.margins = 10; 

    var statictext17 = avgEffPanel.add("statictext", undefined, undefined, {name: "statictext17"}); 
        statictext17.text = "Time: "; 

    var avEffTimeText = avgEffPanel.add("statictext", undefined, undefined, {name: "avEffTimeText"}); 

    var statictext18 = avgEffPanel.add("statictext", undefined, undefined, {name: "statictext18"}); 
        statictext18.text = "Score:"; 

    var avEffScoreText = avgEffPanel.add("statictext", undefined, undefined, {name: "avEffScoreText"}); 

    // AVGZOOMPANEL
    // ============
    var avgZoomPanel = averagesBreakdownPanel.add("panel", undefined, undefined, {name: "avgZoomPanel"}); 
        avgZoomPanel.text = "4: Zooms "; 
        avgZoomPanel.orientation = "row"; 
        avgZoomPanel.alignChildren = ["left","top"]; 
        avgZoomPanel.spacing = 10; 
        avgZoomPanel.margins = 10; 

    var statictext19 = avgZoomPanel.add("statictext", undefined, undefined, {name: "statictext19"}); 
        statictext19.text = "Time: "; 

    var aZoomTimeText = avgZoomPanel.add("statictext", undefined, undefined, {name: "aZoomTimeText"}); 

    var statictext20 = avgZoomPanel.add("statictext", undefined, undefined, {name: "statictext20"}); 
        statictext20.text = "Score:"; 

    var avZoomScoreText = avgZoomPanel.add("statictext", undefined, undefined, {name: "avZoomScoreText"}); 

    // AVGFILEPANEL
    // ============
    var avgFilePanel = averagesBreakdownPanel.add("panel", undefined, undefined, {name: "avgFilePanel"}); 
        avgFilePanel.text = "5: File writes"; 
        avgFilePanel.orientation = "row"; 
        avgFilePanel.alignChildren = ["left","top"]; 
        avgFilePanel.spacing = 10; 
        avgFilePanel.margins = 10; 

    var statictext21 = avgFilePanel.add("statictext", undefined, undefined, {name: "statictext21"}); 
        statictext21.text = "Time: "; 

    var avFileTimeText = avgFilePanel.add("statictext", undefined, undefined, {name: "avFileTimeText"}); 

    var statictext22 = avgFilePanel.add("statictext", undefined, undefined, {name: "statictext22"}); 
        statictext22.text = "Score:"; 

    var avFileScoreText = avgFilePanel.add("statictext", undefined, undefined, {name: "avFileScoreText"}); 

    // AVERAGESBREAKDOWNPANEL
    // ======================
    var divider3 = averagesBreakdownPanel.add("panel", undefined, undefined, {name: "divider3"}); 
        divider3.alignment = "fill"; 

    // AVTOTALPANEL
    // ============
    var avTotalPanel = averagesBreakdownPanel.add("panel", undefined, undefined, {name: "avTotalPanel"}); 
        avTotalPanel.text = "Average totals"; 
        avTotalPanel.orientation = "row"; 
        avTotalPanel.alignChildren = ["left","top"]; 
        avTotalPanel.spacing = 10; 
        avTotalPanel.margins = 33; 

    var statictext23 = avTotalPanel.add("statictext", undefined, undefined, {name: "statictext23"}); 
        statictext23.text = "Time: "; 

    var avTotalTimeText = avTotalPanel.add("statictext", undefined, undefined, {name: "avTotalTimeText"}); 

    var statictext24 = avTotalPanel.add("statictext", undefined, undefined, {name: "statictext24"}); 
        statictext24.text = "Score: "; 

    var avTotalScoreText = avTotalPanel.add("statictext", undefined, undefined, {name: "avTotalScoreText"}); 

    // AVERAGESANDHIGHSTAB
    // ===================
    var divider4 = averagesAndHighsTab.add("panel", undefined, undefined, {name: "divider4"}); 
        divider4.alignment = "fill"; 

    // HIGHBREAKDOWNSPANEL
    // ===================
    var highBreakdownsPanel = averagesAndHighsTab.add("group", undefined, {name: "highBreakdownsPanel"}); 
        highBreakdownsPanel.orientation = "column"; 
        highBreakdownsPanel.alignChildren = ["fill","center"]; 
        highBreakdownsPanel.spacing = 10; 
        highBreakdownsPanel.margins = 0; 

    var highBreakdownText = highBreakdownsPanel.add("statictext", undefined, undefined, {name: "highBreakdownText"}); 
        highBreakdownText.text = "Fastest / highest score"; 

    // HIGHRECTPANEL
    // =============
    var highRectPanel = highBreakdownsPanel.add("panel", undefined, undefined, {name: "highRectPanel"}); 
        highRectPanel.text = "1: Rectangles "; 
        highRectPanel.orientation = "row"; 
        highRectPanel.alignChildren = ["left","top"]; 
        highRectPanel.spacing = 10; 
        highRectPanel.margins = 10; 

    var statictext25 = highRectPanel.add("statictext", undefined, undefined, {name: "statictext25"}); 
        statictext25.text = "Time: "; 

    var highRectTimeText = highRectPanel.add("statictext", undefined, undefined, {name: "highRectTimeText"}); 

    var statictext26 = highRectPanel.add("statictext", undefined, undefined, {name: "statictext26"}); 
        statictext26.text = "Score:"; 

    var highRectScoreText = highRectPanel.add("statictext", undefined, undefined, {name: "highRectScoreText"}); 

    // HIGHTRANSPANEL
    // ==============
    var highTransPanel = highBreakdownsPanel.add("panel", undefined, undefined, {name: "highTransPanel"}); 
        highTransPanel.text = "2:  Transformations average"; 
        highTransPanel.orientation = "row"; 
        highTransPanel.alignChildren = ["left","top"]; 
        highTransPanel.spacing = 10; 
        highTransPanel.margins = 10; 

    var statictext27 = highTransPanel.add("statictext", undefined, undefined, {name: "statictext27"}); 
        statictext27.text = "Time: "; 

    var highTransTimeText = highTransPanel.add("statictext", undefined, undefined, {name: "highTransTimeText"}); 

    var statictext28 = highTransPanel.add("statictext", undefined, undefined, {name: "statictext28"}); 
        statictext28.text = "Score:"; 

    var highTransScoreText = highTransPanel.add("statictext", undefined, undefined, {name: "highTransScoreText"}); 

    // HIGHEFFPANEL
    // ============
    var highEffPanel = highBreakdownsPanel.add("panel", undefined, undefined, {name: "highEffPanel"}); 
        highEffPanel.text = "3:  Effects average"; 
        highEffPanel.orientation = "row"; 
        highEffPanel.alignChildren = ["left","top"]; 
        highEffPanel.spacing = 10; 
        highEffPanel.margins = 10; 

    var statictext29 = highEffPanel.add("statictext", undefined, undefined, {name: "statictext29"}); 
        statictext29.text = "Time: "; 

    var highEffTimeText = highEffPanel.add("statictext", undefined, undefined, {name: "highEffTimeText"}); 

    var statictext30 = highEffPanel.add("statictext", undefined, undefined, {name: "statictext30"}); 
        statictext30.text = "Score:"; 

    var highEffScoreText = highEffPanel.add("statictext", undefined, undefined, {name: "highEffScoreText"}); 

    // HIGHZOOMPANEL
    // =============
    var highZoomPanel = highBreakdownsPanel.add("panel", undefined, undefined, {name: "highZoomPanel"}); 
        highZoomPanel.text = "4: Zooms average"; 
        highZoomPanel.orientation = "row"; 
        highZoomPanel.alignChildren = ["left","top"]; 
        highZoomPanel.spacing = 10; 
        highZoomPanel.margins = 10; 

    var statictext31 = highZoomPanel.add("statictext", undefined, undefined, {name: "statictext31"}); 
        statictext31.text = "Time: "; 

    var highZoomTimeText = highZoomPanel.add("statictext", undefined, undefined, {name: "highZoomTimeText"}); 

    var statictext32 = highZoomPanel.add("statictext", undefined, undefined, {name: "statictext32"}); 
        statictext32.text = "Score:"; 

    var highZoomScoreText = highZoomPanel.add("statictext", undefined, undefined, {name: "highZoomScoreText"}); 

    // HIGHFILEPANEL
    // =============
    var highFilePanel = highBreakdownsPanel.add("panel", undefined, undefined, {name: "highFilePanel"}); 
        highFilePanel.text = "5: File writes average"; 
        highFilePanel.orientation = "row"; 
        highFilePanel.alignChildren = ["left","top"]; 
        highFilePanel.spacing = 10; 
        highFilePanel.margins = 10; 

    var statictext33 = highFilePanel.add("statictext", undefined, undefined, {name: "statictext33"}); 
        statictext33.text = "Time: "; 

    var highFileTimeText = highFilePanel.add("statictext", undefined, undefined, {name: "highFileTimeText"}); 

    var statictext34 = highFilePanel.add("statictext", undefined, undefined, {name: "statictext34"}); 
        statictext34.text = "Score:"; 

    var highFileScoreText = highFilePanel.add("statictext", undefined, undefined, {name: "highFileScoreText"}); 

    // HIGHBREAKDOWNSPANEL
    // ===================
    var divider5 = highBreakdownsPanel.add("panel", undefined, undefined, {name: "divider5"}); 
        divider5.alignment = "fill"; 

    // HIGHTOTALPANEL
    // ==============
    var highTotalPanel = highBreakdownsPanel.add("panel", undefined, undefined, {name: "highTotalPanel"}); 
        highTotalPanel.text = "Fastest / highest total"; 
        highTotalPanel.orientation = "row"; 
        highTotalPanel.alignChildren = ["left","top"]; 
        highTotalPanel.spacing = 10; 
        highTotalPanel.margins = 33; 

    var statictext35 = highTotalPanel.add("statictext", undefined, undefined, {name: "statictext35"}); 
        statictext35.text = "Time: "; 

    var highTotalTimeText = highTotalPanel.add("statictext", undefined, undefined, {name: "highTotalTimeText"}); 

    var statictext36 = highTotalPanel.add("statictext", undefined, undefined, {name: "statictext36"}); 
        statictext36.text = "Score:"; 

    var highTotalScoreText = highTotalPanel.add("statictext", undefined, undefined, {name: "highTotalScoreText"}); 

    // BUTTONGROUP
    // ===========
    var buttonGroup = benchResultsWin.add("group", undefined, {name: "buttonGroup"}); 
        buttonGroup.orientation = "row"; 
        buttonGroup.alignChildren = ["left","center"]; 
        buttonGroup.spacing = 10; 
        buttonGroup.margins = 0; 

    var closeButton = buttonGroup.add("button", undefined, undefined, {name: "closeButton"}); 
        closeButton.text = "Close"; 
        closeButton.onClick = function(){
            benchResultsWin.close();
            return;
        }

    var runAgainButton = buttonGroup.add("button", undefined, undefined, {name: "runAgainButton"}); 
        runAgainButton.text = "Run again"; 
        runAgainButton.onClick = function(){
            benchResultsWin.close();
            app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
            app.redraw();
            return main();
        }

    benchResultsWin.show();
}

/*
Is there a doc open? named "Illustrator Benchnmark test.ai" ?
    in the same directory, is there a file named "Illustrator Benchmark Data.csv"?
        import data
        array of data valid? 
            get info(user input, not env vars) for pre-populating info input screen
    .   .   
    new csv data file
.   new doc

info screen  [environment variables][user input variables]
past runs[ date,results[], info[userInput[],envVars[]]]
if (!pastRuns[i].info) pastRuns[i].info = (search for earlier info)

recurse backwards through 

if data is different 

    //Save prefs if location or parentFolder have been changed from defaults.
        if( location != doc.path || parentFolder != "ImageMagick" ){
                TakeNoteFutureGenerations_THISIsHowToClearAFile:{//argh!
                        preferencesFile.open( "w", "TEXT", $.getenv("USER") ); //It's all in the 'w'
                        preferencesFile.write("");
                        preferencesFile.close();
                }
                logInfo( "computer:.:filename:.:location:.:parentFolder:.:gifFolder", preferencesFile ); //headers
                findThisFileOnThisComputer: { //breaks if existing preference entry for this file on this computer is found, otherwise adds a new entry
                        for(var i = 0; i < preferences.length; i++){ 
                                if( preferences[i].computer == $.getenv( "COMPUTERNAME" )  && preferences[i].filename == doc.name){ //same computer, same file
                                        preferences[i].location = location;
                                        preferences[i].parentFolder = parentFolder;
                                        preferences[i].gifFolder = gifFolder;
                                        break findThisFileOnThisComputer;
                                }
                        }//No break in the loop? let's make a new preference entry then.
                        var obj = {}; 
                        obj.computer = $.getenv( "COMPUTERNAME" );
                        obj.filename = doc.name; 
                        obj.location = location; 
                        obj.parentFolder = parentFolder;
                        obj.gifFolder = gifFolder;
                        preferences.push( obj );
                }
                            
                for(var i = 0; i < preferences.length; i++){ 
                        if( !(File (doc.path + "/" + preferences[i].filename).exists) ){
                                preferences.splice(i,1); //if the file isn't in this folder any more, let's get rid of the preference
                        }
                }
                 for(var i = 0; i < preferences.length; i++){  //Finally, write all those saved preferences back to the file
                       if( preferences[i].computer == undefined || preferences[i].filename == undefined) continue;
                       logInfo( preferences[i].computer + ":.:" + preferences[i].filename + ":.:" + preferences[i].location + ":.:" + preferences[i].parentFolder + ":.:" + preferences[i].gifFolder, preferencesFile);
                 }
        }

function logInfo(Txt, bat){  
    bat.open( "e", "TEXT", $.getenv("USER"));  bat.seek(0,2);   
    $.os.search(/windows/i)  != -1 ? bat.lineFeed = 'windows'  : bat.lineFeed = 'macintosh';  
    bat.writeln(Txt);  
    bat.close();  
}        
        */