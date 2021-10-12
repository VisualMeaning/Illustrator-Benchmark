/*  Adobe Illustrator Benchmark script
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
        InfoUI: pre-fill user input data from file (if present)
        analytics
*/

// @target illustrator

isoDatePrototype();

main();

//_______ Main

function main(runs) {
    var VERSION = "0.63.0"; //script version
    var delimiter = ',';//'\t'
    var runCount = runs || 0;
    var docName = "Illustrator Benchmark Doc.ai";

    var doc = getDoc(docName); //try and get a saved doc (with a path), or an unsaved one if prefered. 

    var csvFilename = "Illustrator Benchmark Data.csv";
    var csvFile = getCSVFile( doc.path + "/" + csvFilename );

    var pastData = csvFile ? 
        getDataFromCsvContents(csvFile.read(), delimiter) : 
        false;
  
    var info = infoUI(pastData,runCount, VERSION, pastData ); //factors that might affect the results - to append to the results for this run

    if (!info) {
       return
    }

    doc.pageItems.removeAll();

    var obj = doc.groupItems.add(); //The art item we'll add complexity to in the tests, to see what kind of impact it has on the benchmark

    var tests = {}; //each test to come back as an object containing name, time and score

    var progress = progressWindow(); //in case you're wondering what's going on

    // Run the tests

    tests.name = "Tests";

    tests.rectangles = funcTimer(function() {
        return rectanglesTest(obj, progress)
    });
    tests.transformations = funcTimer(function() {
        return transformationsTest(obj, progress)
    });
    tests.effects = funcTimer(function() {
        return effectsTest(obj, progress)
    });
    tests.zoom = funcTimer(function() {
        return zoomTest(doc, progress)
    });
    tests.filewrite = funcTimer(function() {
        return fileWriteTest(doc, progress)
    });

    progress(false);

    // Tell us what happened

    var testTotals = sumTests(tests); //total time and score for this test

    if(csvFile){
        recordResults(csvFile, tests, testTotals, pastData, info, delimiter); //write time/score & info to illuBench record.txt file
    }

    displayResults(tests, testTotals, pastData, info, runCount); //Tell us what happened

   // app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}//FIN

/* ______________ TESTS (the interesting bit) __________
   _____________________________________________________ 
   _____________________________________________________
   Do a particular type of operation in a regular, sufficiently-
   complex-to-take-a-few-seconds-to-complete sort of way, return test name
   */

//______ TEST 1

function rectanglesTest(obj, progress) {
    var doc = obj.layer.parent;
    var rects = [];
    progress("Rectangles test");

    for (var i = 0; i < 20; i++) {
        rects[i] = [];
        for (var j = 0; j < 40; j++) {
            rects[i][j] = doc.pathItems.rectangle(-4, 5, 5.5, 6.1);
            rects[i][j].move(obj, ElementPlacement.PLACEATEND);
            rects[i][j].translate(j + (i * 7), j * 12);
            rects[i][j].fillColor.red = rects[i][j].strokeColor.blue = 20 + (Math.round(Math.random() * 70));
            rects[i][j].fillColor.green = rects[i][j].strokeColor.red = 80 + (Math.round(Math.random() * 65));
            rects[i][j].fillColor.blue = rects[i][j].strokeColor.green = 160 + (Math.round(Math.random() * 30));
        }
        app.redraw();
        $.sleep(300);//just to down-weight the score for this test. There's not much going on here so it's less significant.
        for (var k = 0; k < 40; k++) {
            rects[i][k].fillColor.red = rects[i][k].strokeColor.blue = 25 + (Math.round(Math.random() * 50));
            rects[i][k].fillColor.green = rects[i][k].strokeColor.red = 95 + (Math.round(Math.random() * 60));
            rects[i][k].fillColor.blue = rects[i][k].strokeColor.green = 170 + (Math.round(Math.random() * 40));
        }
    }
    centreObj(obj);

    app.redraw();
    return "Rectangles";
}

//______ TEST 2 

function transformationsTest(obj, progress) {

    progress("Transformations");

    for (var i = 0; i < obj.pageItems.length; i++) { // 220,000 points
        //rotate
        obj.pageItems[i].rotate(i * 2.11);
        obj.pageItems[i].resize(111, 188);
        obj.pageItems[i].translate(0.03 * i, 0.05 * i);
        //obj.pageItems[i].zOrder( ZOrderMethod.BRINGFORWARD ); //Is going to mutate the obj.pageItems order while we iterate through it? Not sure...
        obj.pageItems[i].rotate(i * -5.789);
        obj.pageItems[i].resize(93.254, 89.332);
        obj.pageItems[i].resize(106.254, 148.8645);
         obj.rotate(33.337);
         obj.resize(100.0001,100.0001);
         obj.rotate(68.837);
    }

    centreObj(obj);
    app.redraw();
    return "Transformations";
}

//______ TEST 3

function effectsTest(obj, progress) {
    progress("Effects");
    /*Thanks m1b, femkeblanco, Silly-V, CarlosCanto 
    https://community.adobe.com/t5/illustrator/pageitem-applyeffect-liveeffectxml/m-p/7315221
    https://community.adobe.com/t5/illustrator/scripting-live-effects/m-p/11744702 
    https://github.com/mark1bean/ai-live-effect-functions/blob/master/README.md

    Thanks 投稿者: ten_a
    https://translate.google.com/translate?sl=auto&tl=en&u=https://ten-artai.com/2015/12/318/
   */
    var zigzagEffect = '<LiveEffect name="Adobe Zigzag">' + '<Dict data="' +'R roundness 0.2' +'R amount 2' +'R ridges 5' +'R relAmount 0' +'R absoluteness 0.2' +'"/>' + '</LiveEffect>';
    var deformEffect = '<LiveEffect name="Adobe Deform"><Dict data="R DeformValue 0.45 R DeformVert 0 B Rotate 0 I DeformStyle 1 R DeformHoriz 0 "/></LiveEffect>';
    var fuzzyMastEffect = '<LiveEffect name="Adobe Fuzzy Mask"><Dict data="R Radius 3 " /></LiveEffect>';
    var dropShadowEffect = '<LiveEffect name="Adobe Drop Shadow"><Dict data="R horz 7 I blnd 1 R opac 0.35 R dark 70 B pair 1 I csrc 0 R vert 7 R blur 15 B usePSLBlur 1 I Adobe Effect Expand Before Version 16 " /></LiveEffect>';

    for ( var i = 10; i < obj.pageItems.length; i+=13) { 
        obj.pageItems[i].applyEffect(zigzagEffect);
        app.redraw();
    }  
  
    for ( var i = 0; i < obj.pageItems.length; i+=19) { 
        obj.pageItems[i].applyEffect(deformEffect);
        app.redraw();
    }  

    obj.applyEffect(deformEffect);
  //  obj.applyEffect(fuzzyMastEffect);
    obj.applyEffect(dropShadowEffect);

    app.redraw();
    return "Effects";
}

//______ TEST 4

function zoomTest(doc, progress) {
    app.redraw();
    progress("Zoom");
    var view = doc.views[0];
    view.zoom = 1;
    var inc = 0.01; // 0.01; //increment

    for (var a = 1; a > 0.3; a -= inc) {
        view.zoom = a;
        app.redraw();
    }
    app.redraw();
    for (var a = 0.3; a <= 1; a += inc) {
        view.zoom = a;
        app.redraw();
    }
    app.redraw();
    return "Zoom";
}

//______ TEST 5

function fileWriteTest(doc, progress) {
    progress("File write");
    app.redraw();

    for( var i=0; i<2; i++){//Not too many times - don't want to be accused of burning out anyone's storage device
        var dest = doc.path || $.HOMEPATH;
        var exportOptions = new ExportOptionsPNG24();
        exportOptions.antiAliasing = false;
        exportOptions.transparency = false;
        exportOptions.saveAsHTML = true;
        exportOptions.horizontalScale = exportOptions.verticalScale = (i + 1) * 350;

        var type = ExportType.PNG24;
        var filePNG = new File();

        app.activeDocument.exportFile(filePNG, type, exportOptions);
        filePNG.remove();
    }
    return "File write";
}

//________________________________________________________

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

//________________________________________________________

function sumTests(tests) {
    var totals = {
        name : "totals",
        time: 0,
        score: 0
    }
    for(var key in tests){
        totals.time += tests[key].time || 0;
        totals.score += tests[key].score || 0;
    }
    return totals;
}

//_____________________________________________

function funcTimer(test) { //executes tests, returns time and score
    var vars = {};

    var start = new Date().getTime();

    vars.name = test();

    var end = new Date().getTime();

    vars.time = end - start;
    vars.score = score(vars.time);
    return vars;
}

//_____________________________________________

function score(time) {
    var scale = 5000000; //arbitary, but hopefully interesting as a scale for comparison
    if (time <= 1) {
        return false; //doh... 
    }
    return Math.round((1 / time) * scale );
 }

 //_____________________________________________

function getDoc(docName){
    var doc;

    if(app.documents.length>0){ //doc open?
        if(app.activeDocument.name == docName){ //right name?
            $.writeln("Doc found");
            return app.activeDocument;
        }
    } 

    doc = app.documents.add(DocumentColorSpace.RGB); //new doc then
    doc.name = docName;
    
    var location = Folder($.HOMEPATH)
    var location = Folder.selectDialog( //where to save it...
        "The benchmark needs to make a new document in which to run.\
         \nPlease choose a location to save it. \
         \rIf you select a folder, the script will automatically\
         \nsave the results to a CSV file in that same location.\
         \rRunning the benchmark additional times from the same\
         \ndocument will append entries to the CSV file\
         \nfor you to analyse in Excel.\
         \rIf you click cancel, you can still run the benchmark but\
         \nthe results won't be saved.", $.HOMEPATH);
    if( !location){
        return doc; //oh, not saving it then...
    }
    var file = new File(location.toString() + "/" + docName); 
    
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

//_____________________________________________

function getCSVFile( fullPath ){
    var csvFile = File( fullPath );
    csvFile.encoding = 'UTF8',
    csvFile.lineFeed = 'Windows'; //TODO for mac??
    csvFile.open('r',undefined,undefined);
    return csvFile;
}

//_____________________________________________

function getDataFromCsvContents( arr, delimiter ){//return some sort of data structure for past results
    var contents = arr;

    var separator = "~" ; 

    var rows = contents.split('\n');
    var results = getResultsArr( rows, delimiter );

    return results; //results;
}

//_____________________________________________

function getResultsArr( rows, delimiter){ //returns an object containing headers[key] and rows[row number][value]
    var results = {};
    results.headers = rows.shift().split(delimiter);
    results.rows = [];

    for(var i = 0; i < rows.length; i++){
        results.rows[i] = rows[i].split(delimiter);
    }
       
    return results;
}

//_____________________________________________

function popUndefinedOffArr(arr){
    for(var i = arr.length; i > 0; i--){
       if( arr[i] == "undefined" ) {
           arr.pop();
       }else{ //we found something? Ok, stop trimming
           break;
        }
    }
}

//_____________________________________________

function analyseResults(pastData, tests, testTots) {
    //read from file - from the set of all past file runs
    var pastTotals = getTimesAndScores( pastData, "totals");
    var pastRectangles = getTimesAndScores( pastData, "rectangles");
    var pastTransformations = getTimesAndScores( pastData, "transformations");
    var pastEffects = getTimesAndScores( pastData, "effects");
    var pastZoom = getTimesAndScores( pastData,"zoom");
    var pastFileWrite = getTimesAndScores( pastData,"fileWrite");

    var vars = {
        totals: analysis(pastTotals, testTots),
        rectangles : analysis(pastRectangles, tests.rectangles ),
        transformations: analysis(pastTransformations, tests.transformations),
        effects: analysis(pastEffects, tests.effects),
        zoom: analysis(pastZoom, tests.zoom),
        fileWrite: analysis(pastFileWrite, tests.filewrite)
    }
    return vars; //average, mean, time delta, highest on record for individual tests and totals
}

//_____________________________________________

function getTimesAndScores( arr, name){
    var obj = {
        name : name,
        times : [],
        score : []
    };
   // var subArr = [];
    for(var i = 0; i < arr.lengt; i++){
        //test for ^tests followed by ~ + name
        //  test for times
         //   else scores

        //
    }
//match str within subar. Or maybe an obj?

    return subArr;
}

//_____________________________________________

function analysis( arr ){
    /// calculations
    var vars = {
        average: 0,
        mean: 0,
        timeDelta: 0,
        recordTime: 0,
        recordScore: 0
    }
    // average


    // mean
    // timeDelta
    // best time
    // best score

    for(var i = arr.length; i > 0; i--){
    return vars;
}

//_____________________________________________

function objKeysToString(vari, delimiter, par){ //return a delimited string for the object, where each variable is a column header preceded by its parent path 
    var separator = "~" ; 
    var str = "";
    var parents = par || "";
   // alert(vari.toSource());
    for (var key in vari){
       if(key && vari[key] && key != "toJSON"){
            if( typeof vari[key] ==='object'){//it's a parent object 
               parents = (vari.name || "").substring(0, 4) +"~"+ key.substring(0, 4);
               str+=objKeysToString( vari[key], delimiter, parents);
            }else if(key != "name"){ //it's a column header
                str += delimiter + parents + "~"+ key ;
            }
       }
    }
    return str;
}

 //_____________________________________________

function objValsToString(vari, delimiter){
    var str = "";
    for (var key in vari){
        if(key && vari[key] && key != "toJSON"){
            if( typeof vari[key] ==='object'){//it's a parent object 
               str+=objValsToString( vari[key], delimiter);
            }else if(key != "name"){ //it's a column header
                str += delimiter + vari[key];
            }
        }
    }
    return str;
}

//_____________________________________________

function recordResults(csvFile, tests, testTotals, pastResults, info, delimiter) {  
    var headers =  //"Date" + //delimiter +
                objKeysToString(tests,delimiter) + 
                objKeysToString({"totals" : testTotals},delimiter) + 
                objKeysToString(info,delimiter) + 
                "\n";
                
    var row1 =  //info.Date.toString() + 
                objValsToString(tests,delimiter) +
                objValsToString(testTotals,delimiter) + 
                objValsToString(info,delimiter) + 
                "\n"; //alert( "headers ::: " + headers + " ,___row1 :::: " + row1);

    //alert( pastResults.toSource() );
    var oldRows = getPastResultsStrings(pastResults, delimiter).replace(/,$/mg, "");

    writeToCSV( headers + row1 + oldRows, csvFile);
}

 //_____________________________________________

function getPastResultsStrings( pastResults, delimiter){
    var str = "";
    for(var i = 0; i<pastResults.rows.length;i++){
        //alert(pastResults.rows[i].length);
        if(!pastResults.rows[i][0]){ //hacky - but otherwise extra delimiters proliferate rows
            continue;
        }
        for(var j = 0; j<pastResults.rows[i].length;j++){
            str += pastResults.rows[i][j].toString()+ delimiter;
        }
        str+="\n";//( i<pastResults.rows[i].length? "\n" : "");
    }
    return str.replace(/,*$/m, "");
}

 //_____________________________________________

function writeToCSV(txt, csvFile){  
    csvFile.open( "w", "TEXT", $.getenv("USER"));  csvFile.seek(0,2);   
    $.os.search(/windows/i)  != -1 ? csvFile.lineFeed = 'windows'  : csvFile.lineFeed = 'macintosh';  
    csvFile.writeln(txt);  
    csvFile.close();  
} 

//_____________________________________________

function getPastUserInput( pastData, vari ){ //returns data item for vari
    if(!pastData){
        return false;
    }

    var firstRow = pastData.rows[0];
    for(var i=0; i< pastData.headers.length;i++ ){ 
        var regEx = '/^' + vari + '/';
        if( pastData.headers[i].match( regEx )){
            return firstRow[i];//firstRow.slice( firstRow.length -i );
        }
    }

    return false;
    // var firstRow = pataData.rows[0];
    // for(var i=0; i< pastData.headers.length;i++ ){ 
    //     if( pastData.headers[i].test( /^info~Usr_/ )){
    //         return firstRow.slice( firstRow.length -i );
    //     }
    // }
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

function infoUI(pastData, runcount, ver, pastData) { //What factors might be contributing to the benchmark times?
    var date = new Date();
  //  oldInput = getPastUserInput(pastData);
    var vars = {
        name:"info",
        Benchmark_Version : ver,
        Date: date.toISOString(),
        Env_Info : {
            name: "environment_info",
            Illustrator_Version: app.version,
            OS: $.os.replace(/,/g,'-'),
            Screens: $.screens.length,
            CPU: $.getenv("PROCESSOR_IDENTIFIER").replace(/,/g,'-'),
            Threads: $.getenv("NUMBER_OF_PROCESSORS")
        },
        Usr_Inpt :{
            name: "user_input_variables",
            Other_Docs: "",
            Other_Apps: "",
            Optimisation_App: "",
            CPU_Model: getPastUserInput( pastData, "info~Usr_~CPU_Model" ) || "",
            CPU_Mhz: getPastUserInput( pastData, "info~Usr_~CPU_Mhz" ) || "",
            RAM_GB: getPastUserInput( pastData, "info~Usr_~RAM_GB" ) || "",
            RAM_Mhz: getPastUserInput( pastData, "info~Usr_~RAM_Mhz" ) || "",
            GPU_Model: getPastUserInput( pastData, "info~Usr_~GPU_Model" ) || "",
            GPU_Mhz: getPastUserInput( pastData, "info~Usr_~GPU_Mhz" ) || "",
            GPU_RAM: getPastUserInput( pastData, "info~Usr_~GPU_RAM" ) || "",
            HDD: getPastUserInput( pastData, "info~Usr_~HDD" ) || "",
            Note: getPastUserInput( pastData, "info~Usr_~Note" ) || ""
        }
    };

    //https://scriptui.joonas.me <- praise
    var infoUIwin = new Window("dialog");
    infoUIwin.text = "AIBench :: v." + vars.BENCHMARK_VERSION;
    infoUIwin.orientation = "row";
    infoUIwin.alignChildren = ["center", "top"];
    infoUIwin.spacing = 10;
    infoUIwin.margins = 16;

    // GROUP1
    // ======
    var mainGroup = infoUIwin.add("group", undefined, {
        name: "group1"
    });
    mainGroup.orientation = "column";
    mainGroup.alignChildren = ["left", "center"];
    mainGroup.spacing = 10;
    mainGroup.margins = 0;

    // GROUP2
    // ======
    var dateandInfoGroup = mainGroup.add("group", undefined, {
        name: "group2"
    });
    dateandInfoGroup.orientation = "row";
    dateandInfoGroup.alignChildren = ["right", "center"];
    dateandInfoGroup.spacing = 10;
    dateandInfoGroup.margins = 0;
    dateandInfoGroup.alignment = ["fill", "center"];

    var dateStatic = dateandInfoGroup.add("statictext", undefined, undefined, {
        name: "statictext1"
    });
    dateStatic.text = "Date: " + vars.date;
    dateStatic.justify = "right";

   // GROUP3
   // ======
    var paddingGroup = dateandInfoGroup.add("group", undefined, {
        name: "group3"
    });
    paddingGroup.preferredSize.width = 300;
    paddingGroup.orientation = "row";
    paddingGroup.alignChildren = ["left", "top"];
    paddingGroup.spacing = 10;
    paddingGroup.margins = 2;

    var infoButton = dateandInfoGroup.add("button", undefined, undefined, {
        name: "infoButton"
    });
    infoButton.text = "Info";
    infoButton.enabled=false;


    // PANEL1
    // ======
    var mainPanel = mainGroup.add("panel", undefined, undefined, {
        name: "panel1"
    });
    mainPanel.text = "Factors that might affect test results:";
    mainPanel.orientation = "row";
    mainPanel.alignChildren = ["left", "top"];
    mainPanel.spacing = 10;
    mainPanel.margins = 20;

    // GROUP4
    // ======
    var envVarsGroup = mainPanel.add("group", undefined, {
        name: "group4"
    });
    envVarsGroup.orientation = "column";
    envVarsGroup.alignChildren = ["left", "center"];
    envVarsGroup.spacing = 10;
    envVarsGroup.margins = 0;

    // GROUP5
    // ======
    var otherDocsGroup = envVarsGroup.add("group", undefined, {
        name: "group5"
    });
    otherDocsGroup.orientation = "row";
    otherDocsGroup.alignChildren = ["left", "center"];
    otherDocsGroup.spacing = 10;
    otherDocsGroup.margins = 0;


    //////////////

    var otherDocsCheckbox = otherDocsGroup.add("checkbox", undefined, undefined, {
        name: "otherDocsCheckbox"
    });
    otherDocsCheckbox.text = "Are other files currently open in Illustrator?";
    otherDocsCheckbox.value = vars.Usr_Inpt.otherDocs;
    otherDocsCheckbox.onClick = function(){
        vars.Usr_Inpt.otherDocs = otherDocsCheckbox.value;
    }

    // GROUP6
    // ======
    var otherAppsGroup = envVarsGroup.add("group", undefined, {
        name: "group6"
    });
    otherAppsGroup.orientation = "row";
    otherAppsGroup.alignChildren = ["left", "center"];
    otherAppsGroup.spacing = 10;
    otherAppsGroup.margins = 0;

    var otherAppsCheckbox = otherAppsGroup.add("checkbox", undefined, undefined, {
        name: "otherAppsCheckbox"
    });
    otherAppsCheckbox.text = "Have you bothered closing all other apps?";
    otherAppsCheckbox.value = vars.Usr_Inpt.otherApps;
    otherAppsCheckbox.onClick = function(){
        vars.Usr_Inpt.otherApps = otherAppsCheckbox.value;
    }

    // GROUP7
    // ======
    var processOptGroup = envVarsGroup.add("group", undefined, {
        name: "group7"
    });
    processOptGroup.orientation = "row";
    processOptGroup.alignChildren = ["left", "center"];
    processOptGroup.spacing = 10;
    processOptGroup.margins = 0;

    var processOptCheckbox = processOptGroup.add("checkbox", undefined, undefined, {
        name: "processOptCheckbox"
    });
    processOptCheckbox.helpTip = "eg. Process Lasso, CPUCores etc.";
    processOptCheckbox.text = "Is there a process optimisation app running?";
    processOptCheckbox.value = vars.Usr_Inpt.otherApps;
    processOptCheckbox.onClick = function(){
        vars.Usr_Inpt.optimisationApp = processOptCheckbox.value;
    }

    // GROUP4
    // ======
    var divider1 = envVarsGroup.add("panel", undefined, undefined, {
        name: "divider1"
    });
    divider1.alignment = "fill";

    // GROUP8
    // ======
    var group8 = envVarsGroup.add("group", undefined, {
        name: "group8"
    });
    group8.orientation = "row";
    group8.alignChildren = ["left", "center"];
    group8.spacing = 10;
    group8.margins = 0;

    var illuVersionStatic = group8.add("statictext", undefined, undefined, {
        name: "illuVersionStatic"
    });
    illuVersionStatic.text = "Illustrator version: " ;

    var statictext3 = group8.add("statictext", undefined, undefined, {
        name: "statictext3"
    });
    statictext3.text = vars.Env_Info.illuVersion;

    // GROUP9
    // ======
    var group9 = envVarsGroup.add("group", undefined, {
        name: "group9"
    });
    group9.orientation = "row";
    group9.alignChildren = ["left", "center"];
    group9.spacing = 10;
    group9.margins = 0;

    var statictext4 = group9.add("statictext", undefined, undefined, {
        name: "statictext4"
    });
    statictext4.text = "Operating system: ";

    var statictext5 = group9.add("statictext", undefined, undefined, {
        name: "statictext5"
    });
    statictext5.text = vars.Env_Info.os;

    // GROUP10
    // =======
    var group10 = envVarsGroup.add("group", undefined, {
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
    statictext7.text = vars.Env_Info.screens;

    // GROUP11
    // =======
    var group11 = envVarsGroup.add("group", undefined, {
        name: "group11"
    });
    group11.orientation = "row";
    group11.alignChildren = ["left", "center"];
    group11.spacing = 10;
    group11.margins = 0;

    var statictext8 = group11.add("statictext", undefined, undefined, {
        name: "statictext8"
    });
    statictext8.text = "Processor Identifier: ";

    var statictext9 = group11.add("statictext", undefined, undefined, {
        name: "statictext9"
    });
    statictext9.text = vars.Env_Info.cpu;

    // GROUP12
    // =======
    var group12 = envVarsGroup.add("group", undefined, {
        name: "group12"
    });
    group12.orientation = "row";
    group12.alignChildren = ["left", "center"];
    group12.spacing = 10;
    group12.margins = 0;

    var statictext10 = group12.add("statictext", undefined, undefined, {
        name: "statictext10"
    });
    statictext10.text = "Number of Processors: ";

    var threadsStatic = group12.add("statictext", undefined, undefined, {
        name: "threadsStatic"
    });
    threadsStatic.text = vars.Env_Info.threads;

    // GROUP4
    // ======
    var divider2 = envVarsGroup.add("panel", undefined, undefined, {
        name: "divider2"
    });
    divider2.alignment = "fill";

    var noteEdit = envVarsGroup.add('edittext {properties: {name: "edittext1", multiline: true, scrollable: true}}');
    noteEdit.text = "";
    noteEdit.helpTip = "A note about anything else you feel is significant about this run";
    noteEdit.preferredSize.height = 50;
    noteEdit.alignment = ["fill", "center"];
    noteEdit.onChange = function(){
        vars.Usr_Inpt.note = noteEdit.text.replace(/,/g,'-');
    }


    var divider3 = mainPanel.add("panel", undefined, undefined, {
        name: "divider3"
    });
    divider3.alignment = "fill";

    // HARDWARE GROUP _____________________________________________________________
    // ======= 

    var hardwareGroup = mainPanel.add("group", undefined, {
        name: "hardwareGroup"
    });
    hardwareGroup.orientation = "column";
    hardwareGroup.alignChildren = ["right", "center"];
    hardwareGroup.spacing = 10;
    hardwareGroup.margins = 0;

    var hardwareStatic = hardwareGroup.add("statictext", undefined, undefined, {
        name: "hardwareStatic"
    });
    hardwareStatic.helpTip = "This might be interested if you're overclocking or changing hardware";
    hardwareStatic.text = "Hardware";
    hardwareStatic.preferredSize.width = 120;
    hardwareStatic.justify = "center";
    hardwareStatic.alignment = ["center", "center"];

    // GROUP14
    // =======
    var cpuNameGroup = hardwareGroup.add("group", undefined, {
        name: "cpuNameGroup"
    });
    cpuNameGroup.orientation = "column";
    cpuNameGroup.alignChildren = ["fill", "center"];
    cpuNameGroup.spacing = 10;
    cpuNameGroup.preferredSize.height = 24;


    var cpuNameStatic = cpuNameGroup.add("statictext", undefined, undefined, {
        name: "cpuNameStatic"
    });
    cpuNameStatic.helpTip = "eg. 8600k";
    cpuNameStatic.text = "CPU name:";
    cpuNameStatic.onChange = function(){
        vars.Usr_Inpt.CPU_Model = cpuNameStatic.text;
    }
    // GROUP15
    // =======
    var cpuSpeedGroup = hardwareGroup.add("group", undefined, {
        name: "cpuSpeedGroup"
    });
    cpuSpeedGroup.orientation = "column";
    cpuSpeedGroup.alignChildren = ["fill", "center"];
    cpuSpeedGroup.preferredSize.height = 24;
    cpuSpeedGroup.spacing = 10;

    var cpuMhzStatic = cpuSpeedGroup.add("statictext", undefined, undefined, {
        name: "cpuMhzStatic"
    });
    cpuMhzStatic.helpTip = "eg. 4800";
    cpuMhzStatic.text = "CPU Mhz:";

  //  var edittext3 = cpuNameGroup.add('edittext {properties: {name: "edittext3"}}');

    // GROUP16
    // =======
    var group16 = hardwareGroup.add("group", undefined, {
        name: "group16"
    });
    group16.orientation = "column";
    group16.alignChildren = ["fill", "center"];
    group16.preferredSize.height = 24;
    group16.spacing = 10;
    group16.margins = 0;

    var statictext15 = group16.add("statictext", undefined, undefined, {
        name: "statictext15"
    });
    statictext15.helpTip = "eg. 16";
    statictext15.text = "RAM GB:";

  //  var edittext4 = group16.add('edittext {properties: {name: "edittext4"}}');

    // GROUP17
    // =======
    var group17 = hardwareGroup.add("group", undefined, {
        name: "group17"
    });
    group17.orientation = "column";
    group17.alignChildren = ["fill", "center"];
    group17.spacing = 10;
    group17.preferredSize.height = 24;

    var statictext16 = group17.add("statictext", undefined, undefined, {
        name: "statictext16"
    });
    statictext16.helpTip = "eg. 2133";
    statictext16.text = "RAM Mhz:";

 //   var edittext5 = group17.add('edittext {properties: {name: "edittext5"}}');

    // GROUP18
    // =======
    var group18 = hardwareGroup.add("group", undefined, {
        name: "group18"
    });
    group18.orientation = "column";
    group18.alignChildren = ["fill", "center"];
    group18.spacing = 10;
    group18.preferredSize.height = 24;

    var statictext17 = group18.add("statictext", undefined, undefined, {
        name: "statictext17"
    });
    statictext17.helpTip = "eg. GTX 1070 ti";
    statictext17.text = "GPU name:";

 //   var edittext6 = group18.add('edittext {properties: {name: "edittext6"}}');

    // GROUP19
    // =======
    var gpuGroup = hardwareGroup.add("group", undefined, {
        name: "gpuGroup"
    });
    gpuGroup.orientation = "column";
    gpuGroup.alignChildren = ["fill", "center"];
    gpuGroup.spacing = 10;
    gpuGroup.margins = 0;
    gpuGroup.preferredSize.height = 24;

    var gpuMhzStatic = gpuGroup.add("statictext", undefined, undefined, {
        name: "gpuMhzStatic"
    });
    gpuMhzStatic.helpTip = "eg. 1683";
    gpuMhzStatic.text = "GPU Mhz:";

   // var gpuMhzEdit = gpuGroup.add('edittext {properties: {name: "gpuMhzEdit"}}');

    // GROUP20
    // =======
    var ramGroup = hardwareGroup.add("group", undefined, {
        name: "ramGroup"
    });
    ramGroup.orientation = "column";
    ramGroup.alignChildren = ["fill", "center"];
    ramGroup.spacing = 10;
    ramGroup.margins = 0;
    ramGroup.preferredSize.height = 24;

    var ramStatic = ramGroup.add("statictext", undefined, undefined, {
        name: "ramStatic"
    });
    ramStatic.helpTip = "eg. 8";
    ramStatic.text = "GPU RAM GB:";

   // var ramEdit = ramGroup.add('edittext {properties: {name: "ramEdit"}}');

    // GROUP21
    // =======
    var storageGroup = hardwareGroup.add("group", undefined, {
        name: "storageGroup"
    });
    storageGroup.orientation = "column";
    storageGroup.alignChildren = ["left", "center"];
    storageGroup.spacing = 10;
    storageGroup.margins = 0;
    storageGroup.preferredSize.height = 20;

    var storageText = storageGroup.add("statictext", undefined, undefined, {
        name: "storageText"
    });
    storageText.helpTip = "eg. 8";
    storageText.text = "Storage:";


    // HARDWARE EDITS
    // =======

    var hardwareEditGroup = mainPanel.add("group", undefined, {
        name: "hardwareEditGroup"
    });
    hardwareEditGroup.orientation = "column";
    hardwareEditGroup.alignChildren = ["fill", "center"];
    hardwareEditGroup.spacing = 10;
    hardwareEditGroup.margins = 0;

    var blankStatic = hardwareEditGroup.add('statictext {properties: {name: "cpuNameEdit"}}');
    blankStatic.preferredSize.width=250;

    var cpuNameEdit = hardwareEditGroup.add('edittext {properties: {name: "cpuNameEdit"}}');
    cpuNameEdit.onChange = function(){
        vars.Usr_Inpt.CPU_Model = cpuNameEdit.text.replace(/,/g,'-');
    }
    
    var cpuMhzEdit = hardwareEditGroup.add('edittext {properties: {name: "cpuNameEdit"}}');
    cpuMhzEdit.onChange = function(){
        vars.Usr_Inpt.CPU_Mhz = cpuMhzEdit.text.replace(/,/g,'-');
    }

    var ramGBEdit = hardwareEditGroup.add('edittext {properties: {name: "cpuNameEdit"}}');
    ramGBEdit.onChange = function(){
        vars.Usr_Inpt.RAM_GB = ramGBEdit.text.replace(/,/g,'-');
    }
    
    var ramMhzEdit = hardwareEditGroup.add('edittext {properties: {name: "cpuNameEdit"}}');
    ramMhzEdit.onChange = function(){
        vars.Usr_Inpt.RAM_Mhz = ramMhzEdit.text.replace(/,/g,'-');
    }

    var gpuNameEdit = hardwareEditGroup.add('edittext {properties: {name: "cpuNameEdit"}}');
    gpuNameEdit.onChange = function(){
        vars.Usr_Inpt.GPU_Model = gpuNameEdit.text.replace(/,/g,'-');
    }
    
    var gpuMhzEdit = hardwareEditGroup.add('edittext {properties: {name: "cpuNameEdit"}}');
    gpuMhzEdit.onChange = function(){
        vars.Usr_Inpt.GPU_Mhz = gpuMhzEdit.text.replace(/,/g,'-');
    }
    
    var gpuRamEdit = hardwareEditGroup.add('edittext {properties: {name: "cpuNameEdit"}}');
    gpuRamEdit.onChange = function(){
        vars.Usr_Inpt.GPU_RAM = gpuRamEdit.text.replace(/,/g,'-');
    }

    var storageRadioGroup = hardwareEditGroup.add("group", undefined, {
        name: "storageGroup"
    });
    storageRadioGroup.orientation = "row";
    storageRadioGroup.alignChildren = ["left", "center"];
    storageRadioGroup.spacing = 10;
    storageRadioGroup.margins = 0;
    storageRadioGroup.preferredSize.height = 25;
    
    var hdRadio = storageRadioGroup.add("radiobutton", undefined, undefined, {
        name: "hdRadio"
    });
    hdRadio.text = "HD";
    hdRadio.onClick = function(){
        vars.Usr_Inpt.HDD = "HD";
    }

    var ssdRadio = storageRadioGroup.add("radiobutton", undefined, undefined, {
        name: "ssdRadio"
    });
    ssdRadio.text = "SSD";
    ssdRadio.onClick = function(){
        vars.Usr_Inpt.HDD = "SSD";
    }

    var nvmeRadio = storageRadioGroup.add("radiobutton", undefined, undefined, {
        name: "nvmeRadio"
    });
    nvmeRadio.text = "NVMe";
    nvmeRadio.onClick = function(){
        vars.Usr_Inpt.HDD = "NVME";
    }

    switch(vars.Usr_Inpt.HDD){
        case "HD" : {
            hdRadio.value=true;
            break;
        }
        case "SSD" : {
            ssdRadio.value=true;
            break;
        }
        case "NVME" : {
            nvmeRadio.value=true;
            break;
        }
        default : {
            break;
        }
    }

    // GROUP22
    // =======
    var buttonGroup = mainGroup.add("group", undefined, {
        name: "buttonGroup"
    });
    buttonGroup.orientation = "row";
    buttonGroup.alignChildren = ["left", "center"];
    buttonGroup.spacing = 10;
    buttonGroup.margins = 0;
    buttonGroup.alignment = ["fill", "center"];

    var cancel = true;

    var benchmarkButton = buttonGroup.add("button", undefined, undefined, {
        name: "benchmarkButton"
    });
    benchmarkButton.text = "Run benchmark";
    benchmarkButton.onClick = function(){
        cancel = false;
        infoUIwin.close();
    }

    var cancelButton = buttonGroup.add("button", undefined, undefined, {
        name: "cancelButton"
    });
    cancelButton.text = "Cancel";
    cancelButton.onClick = function(){
        infoUIwin.close();
    }

    infoUIwin.show();
    return !cancel ? vars : false; 
}

//_____________DISPLAY RESULTS UI
//_________________________________________
//_________________________________________
//_________________________________________
//_________________________________________


function displayResults( tests, results, pastResults, info, runCount ) {
    //https://scriptui.joonas.me <- praise

    // BENCHRESULTSWIN
    // ===============
    var benchResultsWin = new Window("dialog"); 
        benchResultsWin.text = "Benchmark Results (script version: " + info.VERSION + ")"; 
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
        statictext1.text = "Time:"; 

    var rectTimeText = testRectPanel.add("statictext", undefined, undefined, {name: "rectTimeText"}); 
    rectTimeText.text = tests.rectangles.time;

    var statictext2 = testRectPanel.add("statictext", undefined, undefined, {name: "statictext2"}); 
        statictext2.text = "Score:"; 

    var rectScoreText = testRectPanel.add("statictext", undefined, undefined, {name: "rectScoreText"}); 
    rectScoreText.text = tests.rectangles.score;

    // TESTTRANSPANEL
    // ==============
    var testTransPanel = testResultsGroup.add("panel", undefined, undefined, {name: "testTransPanel"}); 
        testTransPanel.text = "2:  Transformations"; 
        testTransPanel.orientation = "row"; 
        testTransPanel.alignChildren = ["left","top"]; 
        testTransPanel.spacing = 10; 
        testTransPanel.margins = 10; 

    var statictext3 = testTransPanel.add("statictext", undefined, undefined, {name: "statictext3"}); 
        statictext3.text = "Time:"; 

    var transTimeText = testTransPanel.add("statictext", undefined, undefined, {name: "transTimeText"}); 
    transTimeText.text = tests.transformations.time;

    var statictext4 = testTransPanel.add("statictext", undefined, undefined, {name: "statictext4"}); 
        statictext4.text = "Score:"; 

    var transScoreText = testTransPanel.add("statictext", undefined, undefined, {name: "transScoreText"}); 
    transScoreText.text = tests.transformations.score;

    // TESTEFFPANEL
    // ============
    var testEffPanel = testResultsGroup.add("panel", undefined, undefined, {name: "testEffPanel"}); 
        testEffPanel.text = "3:  Effects"; 
        testEffPanel.orientation = "row"; 
        testEffPanel.alignChildren = ["left","top"]; 
        testEffPanel.spacing = 10; 
        testEffPanel.margins = 10; 

    var statictext5 = testEffPanel.add("statictext", undefined, undefined, {name: "statictext5"}); 
        statictext5.text = "Time:"; 

    var effTimeText = testEffPanel.add("statictext", undefined, undefined, {name: "effTimeText"}); 
    effTimeText.text = tests.effects.time;

    var statictext6 = testEffPanel.add("statictext", undefined, undefined, {name: "statictext6"}); 
        statictext6.text = "Score:"; 

    var effScoreText = testEffPanel.add("statictext", undefined, undefined, {name: "effScoreText"}); 
    effScoreText.text = tests.effects.score;

    // TESTZOOMPANEL
    // =============
    var testZoomPanel = testResultsGroup.add("panel", undefined, undefined, {name: "testZoomPanel"}); 
        testZoomPanel.text = "4: Zooms"; 
        testZoomPanel.orientation = "row"; 
        testZoomPanel.alignChildren = ["left","top"]; 
        testZoomPanel.spacing = 10; 
        testZoomPanel.margins = 10; 

    var statictext7 = testZoomPanel.add("statictext", undefined, undefined, {name: "statictext7"}); 
        statictext7.text = "Time:"; 

    var zoomTimeText = testZoomPanel.add("statictext", undefined, undefined, {name: "zoomTimeText"}); 
    zoomTimeText.text = tests.zoom.time;

    var statictext8 = testZoomPanel.add("statictext", undefined, undefined, {name: "statictext8"}); 
        statictext8.text = "Score:"; 

    var zoomScoreText = testZoomPanel.add("statictext", undefined, undefined, {name: "zoomScoreText"}); 
    zoomScoreText.text = tests.zoom.score;

    // TESTFILEPANEL
    // =============
    var testFilePanel = testResultsGroup.add("panel", undefined, undefined, {name: "testFilePanel"}); 
        testFilePanel.text = "5: File writes"; 
        testFilePanel.orientation = "row"; 
        testFilePanel.alignChildren = ["left","top"]; 
        testFilePanel.spacing = 10; 
        testFilePanel.margins = 10; 

    var statictext9 = testFilePanel.add("statictext", undefined, undefined, {name: "statictext9"}); 
        statictext9.text = "Time:"; 

    var fileTimeText = testFilePanel.add("statictext", undefined, undefined, {name: "fileTimeText"}); 
    fileTimeText.text = tests.filewrite.time;

    var statictext10 = testFilePanel.add("statictext", undefined, undefined, {name: "statictext10"}); 
        statictext10.text = "Score:"; 

    var fileScoreText = testFilePanel.add("statictext", undefined, undefined, {name: "fileScoreText"}); 
    fileScoreText.text = tests.filewrite.score;


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
        statictext11.text = "Time:"; 

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
        statictext13.text = "Time:"; 

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
        statictext15.text = "Time:"; 

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
        statictext17.text = "Time:"; 

    var avEffTimeText = avgEffPanel.add("statictext", undefined, undefined, {name: "avEffTimeText"}); 

    var avgEffStatic = avgEffPanel.add("statictext", undefined, undefined, {name: "avgEffStatic"}); 
        avgEffStatic.text = "Score:"; 

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
        statictext19.text = "Time:"; 

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
        statictext21.text = "Time:"; 

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
        statictext23.text = "Time:"; 

    var avTotalTimeText = avTotalPanel.add("statictext", undefined, undefined, {name: "avTotalTimeText"}); 

    var statictext24 = avTotalPanel.add("statictext", undefined, undefined, {name: "statictext24"}); 
        statictext24.text = "Score:"; 

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
        statictext25.text = "Time:"; 

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
        statictext27.text = "Time:"; 

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
        statictext29.text = "Time:"; 

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
        statictext31.text = "Time:"; 

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
        statictext33.text = "Time:"; 

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
        statictext35.text = "Time:"; 

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
           // app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
            app.redraw();
            return main();
        }

    benchResultsWin.show();
}

//_________________________________________________

function isoDatePrototype(){
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
}