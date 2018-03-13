
var InfluenceTracker = function(config) {
  if (!(this instanceof InfluenceTracker)) return new InfluenceTracker(config);

  this.config = config;

  console.log(config);

};

InfluenceTracker.prototype.tracker = function(info) {
  console.log(info);
  var path = info.path;
  var value = info.value;

  if (typeof console !== 'undefined') {
    console.log(path);
    console.log(value);

    // Send data to the backend
    var http = new XMLHttpRequest();
    var url = "enterinfluenceurl";
    var params = path + value;
    http.open("POST", url, true);

//Send the proper header information along with the request
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
                alert(http.responseText);
            }
        }
        http.send(params);


    info.success && setTimeout(info.success, 0);
  } else {
    info.failure && setTimeout(info.failure, 0);
  }
};
