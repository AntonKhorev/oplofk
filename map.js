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
	var span1=6*month, span2=36*month
	var hotness,hotnessPercent,polygonColor
	if (now-date<span1) {
		hotness=(date-(now-span1))/span1
		hotnessPercent=Math.round(100*hotness)
		polygonColor="rgb("+hotnessPercent+"%,0%,"+(100-hotnessPercent)+"%)"
	} else if (now-date<span2) {
		hotness=(date-(now-span2))/(span2-span1)
		hotnessPercent=Math.round(100*hotness)
		polygonColor="rgb(0%,0%,"+hotnessPercent+"%)"
	} else {
		polygonColor="#000"
	}
	L.polygon(segment.p,{color:polygonColor}).bindPopup(popupHtml).addTo(map)
}
