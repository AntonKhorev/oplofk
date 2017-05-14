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

var div=document.getElementById('map')
div.innerHTML=''
var map=L.map(div).addLayer(L.tileLayer(
	'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	{attribution: "© <a href=https://www.openstreetmap.org/copyright>Участники OpenStreetMap</a>"}
))
var now=Date.now()
var segmentLayer=L.featureGroup(data.map(function(segment){
	var popupHtml=
		"<strong>"+segment.n+"</strong><br>"+segment.d+"<br><br>"+
		"проверено <time>"+segment.t+"</time>"
	if (segment.c.length>0) {
		popupHtml+=", записано в пакете <a href=https://www.openstreetmap.org/changeset/"+segment.c+">"+segment.c+"</a>"
	}
	var age=now-Date.parse(segment.t)
	var segmentPolygon=L.polygon(segment.p,{color:computePolygonColor(age,defaultColorThreshold)}).bindPopup(popupHtml)
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
