var defaultColorThreshold=6, maxColorThreshold=36
function computePolygonColor(age,threshold) {
	var month=1000*60*60*24*30
	var span1=threshold*month, span2=maxColorThreshold*month
	var hotness,hotnessPercent
	if (age<span1) {
		hotness=(span1-age)/span1
		hotnessPercent=Math.round(100*hotness)
		return "rgb("+hotnessPercent+"%,0%,"+(100-hotnessPercent)+"%)"
	} else if (age<span2) {
		hotness=(span2-age)/(span2-span1)
		hotnessPercent=Math.round(100*hotness)
		return "rgb(0%,0%,"+hotnessPercent+"%)"
	} else {
		return "#000"
	}
}

function openRcLink(element) {
	(new Image()).src=element.href
	return false
}
function getLink(text,josmLayerTitle,url,josmUrl) {
	if (josmUrl===undefined) josmUrl=url
	return "<a href="+url+">"+text+"</a><sup><a onclick='return openRcLink(this)' href='http://127.0.0.1:8111/import?new_layer=true&upload_policy=false&layer_name="+encodeURIComponent(josmLayerTitle)+"&url="+encodeURIComponent(josmUrl)+"'>RC</a></sup>"
}
function getChangesetsCell(josmLayerTitle,changesetIds) {
	if (changesetIds.length==0) return "нет"
	return changesetIds.map(function(c){
		return getLink(c,josmLayerTitle+" - cset "+c,"https://www.openstreetmap.org/changeset/"+c)
	}).join(", ")
}
function getGoldCell(josmLayerTitle,goldId) {
	if (goldId===undefined) {
		return "нет"
	} else if (goldId==0) {
		return "пусто"
	}
	return getLink("файл",josmLayerTitle,"gold/"+goldId+".osm",window.location.href.replace(/\/[^/]*$/,"/gold/"+goldId+".osm"))
}

var div=document.getElementById('map')
div.innerHTML=''
var map=L.map(div).addLayer(L.tileLayer(
	'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	{attribution: "© <a href=https://www.openstreetmap.org/copyright>Участники OpenStreetMap</a>"}
))
var now=Date.now()
var latAcc=0, lonAcc=0
var segmentLayer=L.featureGroup(data.map(function(segment){
	var LATS=0, LONS=1, NAME=2, DESC=3, SURVEYS=4
	var DATE=0, CSETS=1, GOLD=2
	var popupHtml="<strong>"+segment[NAME]+"</strong><br>"+segment[DESC]+"<br><br><table><tr><th>дата<th>пакеты<th>данные"
	for (var i=0;i<segment[SURVEYS].length;i++) {
		var josmLayerTitle=segment[NAME]+" - "+segment[SURVEYS][i][DATE]
		popupHtml+="<tr><td><time>"+segment[SURVEYS][i][DATE]+"</time><td>"+getChangesetsCell(josmLayerTitle,segment[SURVEYS][i][CSETS])+"<td>"+getGoldCell(josmLayerTitle,segment[SURVEYS][i][GOLD])
	}
	popupHtml+="</table>"
	var age=now-Date.parse(segment[SURVEYS][segment[SURVEYS].length-1][DATE])
	var points=[]
	for (var i=0;i<segment[LATS].length;i++) {
		points.push([
			(latAcc+=segment[LATS][i])/100000,
			(lonAcc+=segment[LONS][i])/100000
		])
	}
	var segmentPolygon=L.polygon(points,{color:computePolygonColor(age,defaultColorThreshold)}).bindPopup(popupHtml)
	segmentPolygon.age=age
	return segmentPolygon
})).addTo(map)
map.fitBounds(segmentLayer.getBounds())

L.Control.Age=L.Control.extend({
	options: {
		position: 'bottomleft'
	},
	onAdd: function(){
		var style=L.DomUtil.create('style','',document.head)
		var div=L.DomUtil.create('div','leaflet-control-age')
		var label=L.DomUtil.create('label','',div)
		label.innerHTML='время с последней проверки, мес. '
		var slider=L.DomUtil.create('input','leaflet-control-age-slider',label)
		slider.type='range'
		slider.min=1
		slider.max=maxColorThreshold-1
		slider.value=defaultColorThreshold
		var scale=L.DomUtil.create('div','leaflet-control-age-scale',div)
		var minValue=L.DomUtil.create('span','leaflet-control-age-min',scale)
		minValue.innerHTML=0
		var maxValue=L.DomUtil.create('span','leaflet-control-age-max',scale)
		maxValue.innerHTML=maxColorThreshold
		var currentValue=L.DomUtil.create('span','leaflet-control-age-current',scale)
		function updateCurrentValue(){
			var pos=(100*slider.value/maxColorThreshold)+'%'
			var backgroundCssLine="background: linear-gradient(to right,#F00 0%,#00F "+pos+",#000 100%);"
			style.innerHTML=
				".leaflet-control-age-slider::-moz-range-track {"+
				backgroundCssLine+
				"} .leaflet-control-age-slider::-webkit-slider-runnable-track {"+
				backgroundCssLine+
				"}"
			if (slider.value>.1*maxColorThreshold && slider.value<.9*maxColorThreshold) {
				currentValue.innerHTML=slider.value
			} else {
				currentValue.innerHTML=''
			}
			currentValue.setAttribute('style','left:'+pos)
		}
		updateCurrentValue()
		L.DomEvent.on(slider,'input change',L.Util.throttle(
			function(ev){
				updateCurrentValue()
				segmentLayer.eachLayer(function(segmentPolygon){
					segmentPolygon.setStyle({color:computePolygonColor(segmentPolygon.age,slider.value)})
				})
			},100)
		)
		L.DomEvent.disableClickPropagation(div)
		return div
	}
})
L.control.age=function(options){
	return new L.Control.Age(options)
}
L.control.age().addTo(map)
