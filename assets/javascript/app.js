var config = {
    apiKey: "AIzaSyDWdDAeH9GKMWidM7HLCxxqDNwDlYXXl3M",
    authDomain: "insanetrain-9c050.firebaseapp.com",
    databaseURL: "https://insanetrain-9c050.firebaseio.com",
    // projectId: "insanetrain-9c050",
    storageBucket: "insanetrain-9c050.appspot.com",
  };

firebase.initializeApp(config);

// Create a variable to reference the database.
 var database = firebase.database();

// Initial Values
var name = "";
var simple = "";
var dest = "";
var first = "";
var freq = "";
var next = "";
var mins = 0;
var trains = [];
var interval;

$("#add-train").on("click", function() {
    event.preventDefault();

    // Capture input values
    name = $("#name-input").val().trim();
    simple = name.replace(/\s+/g, '');
    dest = $("#dest-input").val().trim();
    first = $("#time-input").val().trim();
    freq = $("#freq-input").val().trim();
    
    // Calculate minutes to next arrival
    mins = calcMins(first, freq);

    // Calculate next train arrival time
    next = moment(moment().add(mins, "minutes")).format("hh:mm A");
    
    // Check if this train name has already been used
    if (checkName(name)) {
        // Validate all input fields
        if ((name!="")&&(dest!="")&&(first!="")&&(freq!="")&&(moment(first, 'HH:mm', true).isValid())) {
            database.ref().push({
                name: name,
                simpleName: simple,
                destination: dest,
                firstTime: first,
                frequency: freq,
                dateAdded: firebase.database.ServerValue.TIMESTAMP
            });
        }
        else {
            alert("good grief, FORMAT. please.");
        }
    }
    else {
        alert("yeah sorry, no.  name's been taken");
    }

});

// Every time an entry is added to the database, update the data table to display it
database.ref().on("child_added", function(snapshot) {
    var sv = snapshot.val();

    var tableItem = $("<tr>");
    var tableName = $("<td>");
    var tableDest = $("<td>");
    var tableFreq = $("<td>");
    var tableNext = $("<td>");
    tableNext.attr("id", "next" + sv.name.replace(/\s+/g, ''));
    var tableMins = $("<td>");
    tableMins.attr("id", "mins" + sv.name.replace(/\s+/g, ''));
    var tableUpdate = $("<button>");
    tableUpdate.addClass("update-button");
    tableUpdate.attr("value", sv.name.replace(/\s+/g, ''));
    var tableUpSpot = $("<td>");
    tableUpSpot.attr("style", "white-space: nowrap; text-align: center");
    tableUpSpot.append(tableUpdate);
    tableUpSpot.attr("style", "text-align: center");
    var tableRemove = $("<button>");
    tableRemove.addClass("remove-button");
    tableRemove.attr("value", sv.name.replace(/\s+/g, ''));
    var tableReSpot = $("<td>");
    tableReSpot.attr("style", "white-space: nowrap; text-align: center");
    tableReSpot.append(tableRemove);
    
    tableName.text(sv.name);
    tableDest.text(sv.destination);
    tableFreq.text(sv.frequency);
    tableNext.text(sv.nextArrival);
    tableMins.text(sv.minsAway);
    tableUpdate.text("✔");
    tableRemove.text("X");

    tableItem.append(tableName);
    tableItem.append(tableDest);
    tableItem.append(tableFreq);
    tableItem.append(tableNext);
    tableItem.append(tableMins);
    // tableItem.append(tableUpSpot);
    tableItem.append(tableReSpot);

    var simp = sv.simpleName;
    tableItem.attr("id", "tr-" + simp);

    $("#table-body").append(tableItem);

}, function(errorObject) {
    console.log("Errors handled: " + errorObject.code);
});

$(document).on("click", ".remove-button", function() {
    var thisID = $(this).attr("value");

    // Find the child in firebase database that matches the ID of remove button pressed, and remove it
    var db = firebase.database();
    var ref = db.ref();
    ref.once("value")
        .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var pkey = childSnapshot.key;
            var chval = childSnapshot.val();
            if(chval.simpleName == thisID) {
                ref.child(pkey).remove();
            }
        });
    });

    // Remove this train from the names array
    var index = trains.indexOf(thisID);
    trains.splice(index, 1);

    // Empty out that data table entry for that ID
    var tabID = "#tr-" + thisID;
    $(tabID).empty();
});

// Function to check if a train name is already stored in the database
function checkName(str) {
    for (var i=0; i < trains.length; i++) {
        if (trains[i]===str) {
            return false;
        }
    }
    return true;
};

// Function that takes start time and frequency and returns number of minutes from current moment to next arrival
function calcMins(start, freq) {
    // First Time (pushed back 1 year to make sure it comes before current time)
    var firstTimeConverted = moment(start, "HH:mm").subtract(1, "years");

    // Difference between the times
    var diffTime = moment().diff(moment(firstTimeConverted), "minutes");

    // Time apart (remainder)
    var tRemainder = diffTime % freq;

    // Minutes Until Train
    return mins = freq - tRemainder;
};

// Function to update the next arrival and minutes remaining for all trains in the database and initialize train names array
// (Called whenever page loads and every 1 second with the interval)
function initialize() {
    trains = [];
    var query = firebase.database().ref().orderByKey();
    query.once("value")
    .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            // childData will be the actual contents of the child
            var childData = childSnapshot.val();

            // Store train name of current child and remove all spaces
            var childName = childData.name.replace(/\s+/g, '');

            // Store this simplified name into the names array
            trains.push(childName);

            var childFirst = childData.firstTime;
            var childFreq = childData.frequency;
            var childMins = calcMins(childFirst, childFreq);
            var childNext = moment(moment().add(childMins, "minutes")).format("hh:mm A");

            var nextID = "#next" + childName;
            var minsID = "#mins" + childName;

            // Update the current display to show next arrival time and minutes remaining for current train
            $(nextID).text(childNext);
            $(minsID).text(childMins);
        });
    });
};

initialize();
interval = setInterval(initialize, 1000);