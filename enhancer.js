javascript:(function(){

//FUNCTIONS

//"logic" functions

function getArrivalDate(url){
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.send(null);
	var dates=request.response.split(';');
	var min=dates[0].split(':');
	var max=dates[1].split(':');
	var min_time=new Date(parseInt(min[0]),parseInt(min[1])-1,parseInt(min[2]),parseInt(min[3]),parseInt(min[4]),parseInt(min[5]),parseInt(min[6]));
	var max_time=new Date(parseInt(max[0]),parseInt(max[1])-1,parseInt(max[2]),parseInt(max[3]),parseInt(max[4]),parseInt(max[5]),parseInt(max[6]));
	return [min_time,max_time];
}

function getCoordsByUrl(url){
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.send(null);
	return request.response;
}

function fnAjaxRequest(url,sendMethod,params,type){
    var error=null,payload=null;
    win.$.ajax({
        "async":false,
        "url":url,
        "data":params,
        "dataType":type,
        "type":String(sendMethod||"GET").toUpperCase(),
        "error":function(req,status,err){error="ajax: " + status;},
        "success":function(data,status,req){payload=data;}
    });
    if(error){ throw(error); }
    return payload;
}

function fnCreateConfig(name){return win.$(fnAjaxRequest("/interface.php","GET",{"func":name},"xml")).find("config");}
function fnCreateUnitConfig(){return fnCreateConfig("get_unit_info");}
function fnCreateWorldConfig(){return fnCreateConfig("get_config");}

function getSpeed(unit){ return parseFloat(unitConfig.find(unit+" speed").text()); }
function getPop(unit){ return parseFloat(unitConfig.find(unit+" pop").text()); }
function getBuildTime(unit){ return parseFloat(unitConfig.find(unit+" build_time").text()); }
function currentCoord(){ return game_data.village.coord; }

function distance(source, target){
	return Math.sqrt(Math.pow(source[1]-target[1],2)+Math.pow(source[0]-target[0],2));
}

function travelTime(source, target, unit){
	return getSpeed(unit) * distance(source, target);
}

function addTime(date,time){
	return new Date(date.getTime() + time*1000*60);
}

function getGoodCoords(coords,unit,minTime,maxTime){
	var goodCoords=[];
	var servertime = window.$("#serverTime").html().match(/\d+/g);
	var serverDate = win.$("#serverDate").html().match(/\d+/g);
	var serverTime = new Date(serverDate[1]+"/"+serverDate[0]+"/"+serverDate[2]+" "+servertime.join(":"));
	var closest=60*500;
	var far=0;
	console.log(coords);
	for(var i=0;i<coords.length-1;i++){
		var coordsSplit = coords[i].split('|');
		var travel=travelTime(coordsSplit, currentCoord().split("|"), unit);
		var arrival=addTime(serverTime,travel);
		if(travel<closest){ closest=travel; }
		else if(travel>far){ far=travel; }
		if(arrival>minTime && arrival<maxTime){ goodCoords.push(coords[i]); }
	}
	if(goodCoords.length>0){
		var index=Math.round(Math.random() * (goodCoords.length - 1));
		while(goodCoords.length>0 && alreadySent(currentCoord(),goodCoords[index])){
			goodCoords.splice(index,1);
			index=Math.round(Math.random() * (goodCoords.length - 1));
		}
		if(goodCoords.length>0){
			fillInCoords(goodCoords[index]);
			return goodCoords[index];
		}
		else{
			UI.ErrorMessage("Already sent to all villages in range, try later or change troop type",5000);
			return null;
		}
	}
	else{
		UI.ErrorMessage("No villages in range.\n You will have to launch the script between "+addTime(minTime,(-1)*far).toString()+" and "+addTime(maxTime,(-1)*closest).toString(),6000);
		return null;
	}
}

function fillInCoords(coords){
	var coordsSplit = coords.split('|');
    document.forms[0].x.value = coordsSplit[0];
    document.forms[0].y.value = coordsSplit[1];
    $('#place_target').find('input').val(coordsSplit[0] + '|' + coordsSplit[1]);
}

function alreadySent(myCoords,target){
	var storic;
	if(sessionStorage.alreadySent){
		storic=JSON.parse(sessionStorage.alreadySent);
		if(storic[myCoords]){
			if(storic[myCoords].includes(target)){
				sessionStorage.alreadySent=JSON.stringify(storic);
				return true;
			}
			else{
				storic[myCoords].push(target);
				sessionStorage.alreadySent=JSON.stringify(storic);
				return false;
			}
		}
		else{
			storic[myCoords]=[target];
			sessionStorage.alreadySent=JSON.stringify(storic);
			return false;
		}
	}
	else{
		storic={};
		storic[myCoords]=[target];
		sessionStorage.alreadySent=JSON.stringify(storic);
		return false;
	}
}

function fillInTroops(troopCount, troopPreferences, fakeLimit){
	var troopArray = troopPreferences;
	var keys=Object.keys(troopArray);
	var slowest=["spy"];
	for(var i=0;i<keys.length;i++){
		if(troopArray[keys[i]] && troopCount[keys[i]]>0){
			if(getSpeed(keys[i])>getSpeed(slowest[0])){
				slowest=[];
				slowest.push(keys[i]);
			}
			else if(getSpeed(keys[i])==getSpeed(slowest[0])){
				slowest.push(keys[i]);
			}
		}
	}
	var fakePopNeeded = (fakeLimit == 0) ? 1 : Math.ceil(game_data.village.points / 100 * fakeLimit);
	var troopsToSend=new Array(keys.length).fill(0);
	troopsToSend[keys.indexOf(slowest[0])]++;
	fakePopNeeded-=getPop(slowest[0]);
	var fasterBarrackTroops=findFasterBuild(troopArray)[0];
	var fasterStableTroops=findFasterBuild(troopArray)[1];
	var k=1;
	while(k>0){
		if(fasterBarrackTroops.length>0 && troopCount[fasterBarrackTroops[0]]>troopsToSend[keys.indexOf(fasterBarrackTroops[0])]){
			troopsToSend[keys.indexOf(fasterBarrackTroops[0])]++;
			fakePopNeeded--;
		}
		else{ fasterBarrackTroops.shift(); }
		if(fakePopNeeded<=0){ break; }
		if(fasterStableTroops.length>0 && troopCount[fasterStableTroops[0]]>troopsToSend[keys.indexOf(fasterStableTroops[0])]){
			troopsToSend[keys.indexOf(fasterStableTroops[0])]++;
			fakePopNeeded-=getPop(fasterStableTroops[0]);
		}
		else{ fasterStableTroops.shift(); }
		if(fakePopNeeded<=0 || (fasterBarrackTroops.length<1 && fasterStableTroops.length<1)){ k=-1; }
	}
	if(fakePopNeeded<=0){
		for(var i=0;i<troopsToSend.length;i++){
			document.forms[0][keys[i]].value = troopsToSend[i];
		}
		return slowest[0];
	}
	else{
		alert("no troops to fake");
		return null;
	}
}

function findFasterBuild(troopArray){
	var keys=Object.keys(troopArray);
	var barracks=[], stable=[], workshop=[];
	keys.sort(function(a,b){return getBuildTime(a)-getBuildTime(b);});
	for(var i=0;i<keys.length;i++){
		if(troopArray[keys[i]]){
			if(getPop(keys[i])==1){ barracks.push(keys[i]); }
			else if(keys[i]=="ram" || keys[i]=="catapult"){ workshop.push(keys[i]); }
			else{ stable.push(keys[i]); }
		}
	}
	return [barracks, stable, workshop];
}

/*------------------------------------------------------------------------------------------------------------*/
/*interface functions*/

function dateToIsoFormat(date){
	var offset= -(new Date().getTimezoneOffset() / 60);
	date=new Date(date.getTime()+1000*60*60*offset);
	return date.toISOString().split(".")[0];
}

function setManual(){
	mode="manual";
	document.getElementById("coordsUrl").disabled=true;
	document.getElementById("arrivalUrl").disabled=true;
	document.getElementById("coords").disabled=false;
	document.getElementById("minDate").disabled=false;
	document.getElementById("maxDate").disabled=false;
}

function setByUrl(){
	mode="byUrl";
	document.getElementById("coords").disabled=true;
	document.getElementById("minDate").disabled=true;
	document.getElementById("maxDate").disabled=true;
	document.getElementById("coordsUrl").disabled=false;
	document.getElementById("arrivalUrl").disabled=false;
}

function getCoords(){
	coords=document.getElementById("coords").value.match(/\d{1,3}\|\d{1,3}/g);
}

function getCoordsUrl(){
	coordsUrl=document.getElementById("coordsUrl").value;
}

function getArrival(){
	minArrival=new Date(document.getElementById("minDate").value);
	maxArrival=new Date(document.getElementById("maxDate").value);
	document.getElementById("maxDate").min=document.getElementById("minDate").value;
	document.getElementById("minDate").max=document.getElementById("minDate").value;
}

function getArrivalUrl(){
	arrivalUrl=document.getElementById("arrivalUrl").value;
}

function updateUnits(){
	for(var i=0;i<unitNames.length;i++){
		unitPreference[unitNames[i]]=document.getElementById(unitNames[i]+"Check").checked;
	}
}

function saveSettings(){
	if(minArrival>maxArrival){
		UI.ErrorMessage('Incorrect time interval');
	}
	else if(coords==null || coords.length==0){
		UI.ErrorMessage('Insert at least one target',5000);
	}
	else{
		if(mode=="manual"){
			localStorage.smartFakeSettings=mode+":::"+JSON.stringify(coords)+":::"+minArrival+":::"+maxArrival+":::"+JSON.stringify(unitPreference);
		}
		else{
			localStorage.smartFakeSettings=mode+":::"+coordsUrl+":::"+arrivalUrl+":::"+JSON.stringify(unitPreference);
		}
		UI.SuccessMessage('Settings saved', 3000);
	}
}

function reset(){
	localStorage.removeItem("smartFakeSettings");
	coords=[];
	coordsUrl="";
	minArrival=new Date();
	maxArrival=new Date(minArrival.getTime() + 1000*60*60);
	arrivalUrl="";
	unitPreference={};
	mode="manual";
	unitNames=[];
	openUI();
}

function openUI(){
	var images="";
	var checkBoxes="";

	if(localStorage.smartFakeSettings){
		var savedSettings=localStorage.smartFakeSettings.split(":::");
		if(savedSettings[0]=="manual"){
			mode=savedSettings[0];
			try{ coords=JSON.parse(savedSettings[1]); }
			catch(error){ localStorage.removeItem("smartFakeSettings"); coords=[]; }
			minArrival=new Date(savedSettings[2]);
			maxArrival=new Date(savedSettings[3]);
			unitPreference=JSON.parse(savedSettings[4]);
		}
		else{
			mode=savedSettings[0];
			coordsUrl=savedSettings[1];
			arrivalUrl=savedSettings[2];
			unitPreference=JSON.parse(savedSettings[3]);
		}
	}

	for(var i=0;i<game_data.units.length;i++){
		if(game_data.units[i] != "militia" && game_data.units[i] != "knigth"){
			unitNames.push(game_data.units[i]);
		}
	}
	for(var i=0;i<unitNames.length;i++){
		images+=	'<td><img src="https://dsen.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_'+unitNames[i]+'.png" title="'+unitNames[i]+'" class="unitImage"></td>';
		if(unitNames[i] in unitPreference && unitPreference[unitNames[i]]){
			checkBoxes+='<td><input type="checkbox" id="'+unitNames[i]+'Check" onchange="updateUnits()" checked="true"></td>';
		}
		else{
			checkBoxes+='<td><input type="checkbox" id="'+unitNames[i]+'Check" onchange="updateUnits()"></td>';
		}
	}

	var html='<head></head><body><h1>Smart fake script</h1><form><fieldset><legend>Data Source</legend><h2>Select Data Source</h2><p><input type="radio" id="manual" name="source" value="manual" checked="true" onchange="setManual()"> Insert manually targets and landing time</p><p><input type="radio" id="tribe" name="source" value="url" onchange="setByUrl()"> Get targets and landing time from URL</p></fieldset><fieldset><legend>Manual settings</legend><p><h2>Coords to fake</h2><label>Coords:</label><textarea id="coords" rows="5" cols="70" placeholder="Insert the coords to fake" onchange="getCoords()"></textarea></p><p><h2>Arrival date</h2><label>Fakes will land between </label><input type="datetime-local" id="minDate" value="'+dateToIsoFormat(minArrival)+'" onchange="getArrival()"><label> and </label><input type="datetime-local" id="maxDate" value="'+dateToIsoFormat(maxArrival)+'" onchange="getArrival()"></p></fieldset><fieldset><legend>Tribe settings</legend><p><h2>Coords URL</h2><label>Coords URL: </label><input type="text" id="coordsUrl" placeholder="https://..." onchange="getCoordsUrl()" disabled="true"></p><p><h2>Arrival URL</h2><label>Arrival URL: </label><input type="text" id="arrivalUrl" placeholder="https://..." onchange="getArrivalUrl()" disabled="true"></p></fieldset></form><fieldset><legend>Units Settings</legend><table border="1"><tr><th colspan="'+unitNames.length+'">Select units to use</th></tr><tr>'+images+'</tr><tr>'+checkBoxes+'</tr></table></fieldset><p><input type="button" class="btn evt-confirm-btn btn-confirm-yes" onclick="saveSettings()" value="Save"> <input type="button" class="btn evt-confirm-btn btn-confirm-no" onclick="reset()" value="Reset settings"></p></body>';

	Dialog.show("Script settings", html);

	if(mode=="manual"){
		document.getElementById("coordsUrl").disabled=true;
		document.getElementById("arrivalUrl").disabled=true;
		document.getElementById("coords").disabled=false;
		document.getElementById("minDate").disabled=false;
		document.getElementById("maxDate").disabled=false;
		document.getElementById("coords").value=coords;
	}
	else{
		document.getElementById("coords").disabled=true;
		document.getElementById("minDate").disabled=true;
		document.getElementById("maxDate").disabled=true;
		document.getElementById("coordsUrl").disabled=false;
		document.getElementById("arrivalUrl").disabled=false;
		document.getElementById("coordsUrl").value=coordsUrl;
		document.getElementById("arrivalUrl").value=arrivalUrl;
		document.getElementById("tribe").checked=true;
	}
}

/*------------------------------------------------------------------------------------------------------------*/
// ACTUAL CODE — variáveis partilhadas declaradas aqui para serem visíveis em todas as funções acima

var coords=[];
var coordsUrl="";
var minArrival=new Date();
var maxArrival=new Date(minArrival.getTime() + 1000*60*60);
var arrivalUrl="";
var unitPreference={};
var mode="manual";
var unitNames=[];
var win, unitConfig, worldConfig, fakeLimit;

var server=game_data["market"];
var player=game_data["player"]["id"];

if(server=="it" && player==188666){
	alert("Ma succhiamelo, coglione");
}
else if(server=="it" && player==357264){
	alert("Ma succhiamelo, coglione");
}
else if(game_data.screen=='place'){
	win=window;
	unitConfig=fnCreateUnitConfig();
	worldConfig=fnCreateWorldConfig();
	fakeLimit=parseFloat(worldConfig['find']('fake_limit')[0].innerHTML);
	var troopCounts={};
	$('a[id^=units_entry_all_]').each(function(i,el){
		var id=$(el).attr('id');
		var unit=id.match(/units_entry_all_(\w+)/)[1];
		var count=$(el).text().match(/\((\d+)\)/)[1];
		troopCounts[unit]=parseInt(count);
	});

	if(localStorage.smartFakeSettings){
		var twFakeSettings=localStorage.smartFakeSettings;
		mode=twFakeSettings.split(":::")[0];
		if(mode=="manual"){
			try{ coords=JSON.parse(twFakeSettings.split(":::")[1]); }
			catch(error){
				localStorage.removeItem("smartFakeSettings");
				UI.ErrorMessage("Script has been updated, please insert the settings again");
			}
			minArrival=new Date(twFakeSettings.split(":::")[2]);
			maxArrival=new Date(twFakeSettings.split(":::")[3]);
			troopPreference=JSON.parse(twFakeSettings.split(":::")[4]);
		}
		else if(mode=="byUrl"){
			coords=getCoordsByUrl(twFakeSettings.split(":::")[1]);
			var dates=getArrivalDate(twFakeSettings.split(":::")[2]);
			minArrival=dates[0];
			maxArrival=dates[1];
			troopPreference=JSON.parse(twFakeSettings.split(":::")[3]);
		}
		var troops=fillInTroops(troopCounts, troopPreference, fakeLimit);
		if(troops!=null){
			getGoodCoords(coords, troops, minArrival, maxArrival);
		}
	}
	else{
		openUI();
	}
}
else{
	openUI();
}

})();
