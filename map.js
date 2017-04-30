var div=document.getElementById('map')
var y1=59.940
var y2=59.896
var x1=30.251
var x2=30.343
var map=L.map(div).addLayer(L.tileLayer(
	'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
	{attribution: "© <a href='http://www.openstreetmap.org/copyright'>Участники OpenStreetMap</a>"}
)).fitBounds([
	[y1,x1], // top left
	[y2,x2], // bottom right
])
for (var i=0;i<data.length;i++) {
	var segment=data[i]
	var popupHtml=
		"<strong>"+segment.n+"</strong><br>"+segment.d+"<br><br>"+
		"проверено <time>"+segment.t+"</time>"
	if (segment.c.length>0) {
		popupHtml+=", записано в пакете <a href=http://www.openstreetmap.org/changeset/"+segment.c+">"+segment.c+"</a>"
	}
	var date=Date.parse(segment.t)
	var now=Date.now()
	var month=1000*60*60*24*30
	var hotness,hotnessPercent,polygonColor
	if (date-now<6*month) {
		hotness=(date-(now-6*month))/(6*month)
		hotnessPercent=Math.round(100*hotness)
		polygonColor="rgb("+hotnessPercent+"%,0%,"+(100-hotnessPercent)+"%)"
	} else if (date-now<36*month) {
		hotness=(date-(now-36*month))/(30*month)
		hotnessPercent=Math.round(100*hotness)
		polygonColor="rgb(0%,0%,"+hotnessPercent+"%)"
	} else {
		polygonColor="#000"
	}
	L.polygon(segment.p,{color:polygonColor}).bindPopup(popupHtml).addTo(map)
}
