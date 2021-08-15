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
        Design results display
        Design data file
            storing info - (per run? or global? or both?)
            storing results
        reading data file back in
            analytics
*/

// @target illustrator

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
    var VERSION = 0.61; //script version
    var delimiter = ',';//'\t'
    var runCount = runs || 0;
    var docName = "Illustrator Benchmark Doc.ai";
    var doc = getDoc(docName); //try and get a saved doc (with a path), or an unsaved one if prefered. 

    var csvFilename = "Illustrator Benchmark Data.csv";
    var csvFile = getCSVFile( doc.path + "/" + csvFilename );
  //  alert( csvFile.read());

    // var csvFile = doc.path ?
    //     getCSVFile(doc.path + "/" + csvFilename) :
    //     false; //if there's an appropriately named csv file already in this location, get the contents 
   // alert( csvFile.toString());
  // alert("CSV: " + csvFile.read());
    var pastData = csvFile ? 
        getDataFromCsvContents(csvFile.read(), delimiter) : //currently returns a flat object  
        false;
  //  alert( pastData.toString());

    //var pastResults = analyseResults(); //average, mean, time delta, highest on record for individual tests and totals

    var info = infoUI(pastData,runCount, VERSION); //factors that might affect the results - to append to the results for this run

    if (!info) {
       return
    }

    //app.executeMenuCommand('doc-color-rgb'); //TODO might be interesting to compare results in CYMK!
    //doc.documentColorSpace = DocumentColorSpace.RGB;

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
    //alert( $.line + " - testTotals -> " + testTotals.toSource());

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

    for (var i = 0; i < 3; i++) {
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
        $.sleep(40);//just to down-weight the score for this test. It's less important than the others.
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
        //obj.pageItems[i].translate(0.03 * i, 0.05 * i);
        //obj.pageItems[i].zOrder( ZOrderMethod.BRINGFORWARD ); //Is going to mutate the obj.pageItems order while we iterate through it? Not sure...
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

    投稿者: ten_a <-
    https://translate.google.com/translate?sl=auto&tl=en&u=https://ten-artai.com/2015/12/318/
        #Drop Shadow
        <LiveEffect name="Adobe Drop Shadow"><Dict data="R horz 7 I blnd 1 R opac 0.75 R dark 100 B pair 1 I csrc 0 R vert 7 R blur 5 B usePSLBlur 1 I Adobe Effect Expand Before Version 16 " /></LiveEffect>

        #Fuzzy Mask
        <LiveEffect name="Adobe Fuzzy Mask"><Dict data="R Radius 5 " /></LiveEffect>

        #Inner Grow
        <LiveEffect index="0″ major="1″ minor="0″ name="Adobe Inner Glow"><Dict data="I gtyp 1 I blnd 2 R opac 0.75 R blur 5 “><Entry name="gclr" valueType="F"><Fill color="1 0 0 0 0″/></Entry></Dict></LiveEffect>

        #Outer Grow
        <LiveEffect name="Adobe Outer Glow"><Dict data="I Adobe Effect Expand Before Version 16 I blnd 2 R opac 0.75 R blur 5 B usePSLBlur 1 " /></LiveEffect>

        #Scribble Fill
        <LiveEffect name="Adobe Scribble Fill"><Dict data="R Spacing 5 R EdgeOverlap 0 R Scribbliness 0.05 R StrokeWidth 3 R Angle 30 R EdgeOverlapVariation 5 R SpacingVariation 0.5 R ScribbleVariation 0.01 " /></LiveEffect>

        #Round Corners
        <LiveEffect name="Adobe Round Corners"><Dict data="R radius 10 “/></LiveEffect>

        #Outline Type
        <LiveEffect index="0″ isPre="1″ major="1″ minor="0″ name="Adobe Outline Type"><Dict /></LiveEffect>

        #Outline Stroke
        <LiveEffect index="0″ major="1″ minor="0″ name="Adobe Outline Stroke"><Dict /></LiveEffect>

        #Offset Path
        <LiveEffect name="Adobe Offset Path"><Dict data="R mlim 4 R ofst 10 I jntp 2 " /></LiveEffect>

        #Zigzag
        <LiveEffect name="Adobe Zigzag"><Dict data="R roundness 0 R absoluteness 1 R relAmount 10 R ridges 4 R amount 10.006 " /></LiveEffect>

        #Free Disort
        <LiveEffect name="Adobe Free Distort"><Dict data="R src3h 278 R src2h 178 R dst2v -263 R src2v -263 R src0h 178 R dst2h 178 R src3v -263 R dst3v -263 R dst0v -163 R src1h 278 R src1v -163 R src0v -163 R dst0h 178 R dst1v -163 R dst1h 278 R dst3h 278 " /></LiveEffect>

        #Punck & Bloat
        <LiveEffect name="Adobe Punk and Bloat"><Dict data="R d_factor 10 " /></LiveEffect>

        #Twirl
        <LiveEffect name="Adobe Twirl"><Dict data="R angle 30 " /></LiveEffect>

        #Pathfinder
        <LiveEffect name="Adobe Pathfinder"><Dict data="R TrapTintTolerance 0.05 B ExtractUnpainted 1 B TrapConvertCustom 0 R TrapAspect 1 B ConvertCustom 1 R TrapMaxTint 1 R Mix 0.5 B RemovePoints 0 I Command 0 R TrapThickness 0.25 R TrapTint 0.4 B TrapReverse 0 R Precision 10 “><Entry name="DisplayString" value="" valueType="S" /></Dict><LiveEffect>

        #3D Effect
        <LiveEffect name="Adobe 3D Effect"><Dict data="B showHiddenSurfaces 0 R cameraPerspective 0 I rotationPresetKey 9 B paramsDictionaryInitialized 1 I 3Dversion 2 B extrudeCap 1 R mat_12 -0.278 R mat_13 0 R mat_20 -0.456 R mat_21 0.248 R mat_22 0.855 R mat_23 0 R mat_30 0 R mat_31 0 R mat_32 0 R mat_33 1 R rotX -18 R rotY -26 R rotZ 8 R revolveAngle 360 B revolveCap 1 R revolveOffset 0 I revolveAxisMode 0 I surfaceStyle 3 R surfaceAmbient 50 R surfaceMatte 40 R surfaceGloss 10 R blendSteps 25 B invisibleGeo 0 I shadeMode 3 B preserveSpots 0 I numLights 1 B shadeMaps 0 I numArtMaps 0 R mat_11 0.961 R mat_10 0.002 R mat_03 0 R mat_02 0.438 R mat_01 0.125 R mat_00 0.89 I effectStyle 0 R bevelHeight 4 B bevelExtentIn 1 R extrudeDepth 50 “><Entry name="shadeColor" valueType="F"><Fill color="1 0 1 1 0″/></Entry><Entry name="light0″ valueType="D"><Dict data="R lightDirX 0.39 R lightDirY 0.33 R lightDirZ -0.85 R lightPosX 0 R lightPosY 0 R lightPosZ -1 R lightIntensity 1 " /></Entry><Entry name="DisplayString" value="3D " valueType="S"/></Dict></LiveEffect>
    */
    var zigzagEffect = '<LiveEffect name="Adobe Zigzag">' + '<Dict data="' +'R roundness 0.2' +'R amount 2' +'R ridges 5' +'R relAmount 0' +'R absoluteness 0.2' +'"/>' + '</LiveEffect>';
    var deformEffect = '<LiveEffect name="Adobe Deform"><Dict data="R DeformValue 0.45 R DeformVert 0 B Rotate 0 I DeformStyle 1 R DeformHoriz 0 "/></LiveEffect>';
    var fuzzyMastEffect = '<LiveEffect name="Adobe Fuzzy Mask"><Dict data="R Radius 3 " /></LiveEffect>';
    var dropShadowEffect = '<LiveEffect name="Adobe Drop Shadow"><Dict data="R horz 7 I blnd 1 R opac 0.55 R dark 90 B pair 1 I csrc 0 R vert 7 R blur 10 B usePSLBlur 1 I Adobe Effect Expand Before Version 16 " /></LiveEffect>';

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

function getResultsArr( rows, delimiter){ //returns an object contain headers[key] and rows[row number][value]
    var results = {};
    results.headers = rows.shift().split(delimiter);
    results.rows = [];

    for(var i = 0; i < rows.length; i++){
        results.rows[i] = rows[i].split(delimiter);
    }
    popUndefinedOffArr(results.rows);
       
    return results;
}
//_____________________________________________
function popUndefinedOffArr(arr){
    for(var i = arr.length; i > 0; i--){
       if(arr[i]=="undefined"){
           arr.pop();
       }else{ //we found something? Ok, stop trimming
           break;
        }
    }
}


function analyseResults(results) {
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

function objValsToString(vari, delimiter, st){
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
    return str.replace(/^','/m,"");
}

function recordResults(csvFile, tests, testTotals, pastResults, info, delimiter) {
    // alert(tests.toSource());
    // alert(testTotals.toSource());
    // alert(pastResults.toSource());
    // alert(info.toSource());
    
    var headers =  "date" + //delimiter +
                objKeysToString(tests,delimiter) + 
                objKeysToString({"totals" : testTotals},delimiter) + 
                objKeysToString(info,delimiter) + 
                "\n";
                
    var row1 =  info.date.toString() + 
                objValsToString(tests,delimiter) +
                objValsToString(testTotals,delimiter) + 
                objValsToString(info,delimiter) + 
                "\n"; //alert( "headers ::: " + headers + " ,___row1 :::: " + row1);

    //alert( pastResults.toSource() );
    var oldRows = getPastResultsStrings(pastResults, delimiter);

    writeToCSV( headers + row1 + oldRows, csvFile);
}


 //_____________________________________________

function getPastResultsStrings( pastResults, delimiter){
    var str = "";
    for(var i = 0; i<pastResults.rows.length;i++){
        //alert(pastResults.rows[i].length);
        for(var j = 0; j<pastResults.rows[i].length;j++){
            //alert(pastResults.rows[i][j]);
            str += pastResults.rows[i][j].toString()+ delimiter;
        }
        str+="\n";
    }
    return str || "";
}

 //_____________________________________________

function writeToCSV(txt, csvFile){  
    csvFile.open( "w", "TEXT", $.getenv("USER"));  csvFile.seek(0,2);   
    $.os.search(/windows/i)  != -1 ? csvFile.lineFeed = 'windows'  : csvFile.lineFeed = 'macintosh';  
    csvFile.writeln(txt);  
    csvFile.close();  
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

function infoUI(pastData, runcount, ver) { //What factors might be contributing to the benchmark times?
    var date = new Date();
    var vars = {
        name:"info",
        BENCHMARK_VERSION : ver,
        date: date.toISOString(),
        Env_Info : {
            name: "environment_info",
            illuVersion: app.version,
            os: $.os,
            screens: $.screens.length, //number of displays? TODO - calculate resolutions (left,top,right,bottom)
            cpu: $.getenv("PROCESSOR_IDENTIFIER"),
            threads: $.getenv("NUMBER_OF_PROCESSORS")
        },
        Usr_Inpt :{
            name: "user_input_variables",
            otherDocs: null,
            otherApps: null,
            optimisationApp: null,
            CPU_Model:null,
            CPU_Mhz:null,
            RAM_GB:null,
            RAM_Mhz:null,
            GPU:null,
            HDD:null
        }
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




// function getObjs( obj, arr){
//     obj = obj || {};
//     if( arr.length ){
//         return {obj:""};
//     }
// }



/*function getObjs( keys, separator ){
/*
date
test~recta~time
test~recta~score
info~env_~

data:xxxx,
test:{
    name:test,
    recta:{
        name:recta,
        time,
        score
    }
}

Create an index of object references to assign to row values
*//*

    var objs ={};
    for( var i = 0; i < keys.length; i++){
       // var thisObj = {};
        var parts = keys[i].split(separator);
        var tempObj = objs[parts[i]];
        
        

        var k = parts.length;
        while(k){
            var a = parts.unshift()
        }
        
        
        var tempObj = {}
        while(parts.length){
            
        }

        var parent, child;
        
        for( var j = 0; j < parts.length; j++){
            child = parts.length-1;
            parent = parts.length-2
            
            objs[parts[i]] = {};
        }
    } 
    return objs;
}*/



// var buildParts(  parts,  a, b ){
//     var obj = {}
//     var l = parts.length;

//     if(parts){
//         return 
//     }

//     while(l){
//         obj[parts.unshift] = {}
//     }
//     return obj;
// }

// function getObjs( keys ){
//     var objs ={}
//     for( var i = 0; i < keys.length; i++){
//         var parts = keys[i].split(separator);
//         for( var j = 0; j < parts.length; j++){
//             for( var key in parts[j]){
//                 objs[key] = parts[j];
//             }
//         }
//     } 
//     return objs;
// }

// function addRowsToObjs( objs, rows){
//     //index from 1
//     return results;
// }


               // assign them to the heads

        // for(var j=0; j< keys.length;j++){
        //     tempObj[keys[j]] = cells[j]; //TODO differentiate between results and info
        // }

        //alert(rows.toString());

        // var resultsObj = {};
        // for(var k in tempObj){
        //     switch( k ){
        //         case /^date/:
        //             resultsObj["date"]=obj[k];
        //             break;
        //         case /^test/:
        //             resultsObj["tests"][k]=obj[k];
        //             break;
        //         case /^env/:
        //             resultsObj["env"][k]=obj[k];
        //             break;
        //         case /^info/:
        //             resultsObj["info"][k]=obj[k];
        //             break;
        //         default:
        //             $.writeln( $line + " - " + k + " : " + obj[k] + " fell through the switch statement");
        //             break;
        //     }
        // }
        // results.push(resultsObj); // add to data