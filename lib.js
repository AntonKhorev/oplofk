const fs=require('fs')
const readline=require('readline')
const mkdirp=require('mkdirp')
const OSMStream=require('node-osm-stream')

const readSegments=(filename,callback)=>{
	const nodes={}
	const ways={}
	const parser=OSMStream()
	fs.createReadStream(filename).pipe(parser).on('data',()=>{}).on('end',()=>{
		callback(ways)
	})
	parser.on('node',(node,callback)=>{
		nodes[node.id]=[node.lat,node.lon]
		callback(null)
	}).on('way',(way,callback)=>{
		ways[way.tags.name]={
			name: way.tags.name,
			description: way.tags.description,
			nodes: way.nodes.map(nodeId=>nodes[nodeId]),
		}
		callback(null)
	}).on('relation',(way,callback)=>{
		callback(null)
	})
}

const readSurveys=(filename,segments,callback)=>{
	const surveyedSegments=new Map()
	readline.createInterface({
		input: fs.createReadStream(filename)
	}).on('line',(line)=>{
		const [segmentName,surveyDate,surveyChangeset]=line.split(';')
		if (surveyedSegments.has(segmentName)) {
			surveyedSegments.delete(segmentName) // force reorder
		}
		const segment=segments[segmentName]
		const surveyedSegment={
			n: segment.name,
			d: segment.description,
			p: segment.nodes.map(node=>node.map(n=>+n.toFixed(5))),
			t: surveyDate,
			c: surveyChangeset,
		}
		surveyedSegments.set(segmentName,surveyedSegment)
	}).on('close',()=>{
		callback(surveyedSegments)
	})
}

const writeHtml=(prefix,htmlName,title)=>{
	fs.writeFile(`public_html/${htmlName}`,[
		`<!DOCTYPE html>`,
		`<html lang=ru>`,
		`<head>`,
		`<meta charset=utf-8>`,
		`<title>${title}</title>`,
		`<link rel=stylesheet href='https://unpkg.com/leaflet@1.0.2/dist/leaflet.css'>`,
		`<script src='https://unpkg.com/leaflet@1.0.2/dist/leaflet.js'></script>`,
		`<style>`,
		`html, body {`,
		`	height: 100%;`,
		`	margin: 0;`,
		`	padding: 0;`,
		`}`,
		`#map {`,
		`	width: 100%;`,
		`	height: 100%;`,
		`}`,
		`</style>`,
		`</head>`,
		`<body>`,
		`<div id='map'>при включённом js здесь будет карта</div>`,
		`</body>`,
		`<script src='${prefix}-data.js'></script>`,
		`<script src='map.js'></script>`,
		`</html>`,
	].join('\n'))
}

const writeData=(prefix)=>{
	readSegments(`${prefix}-segments.osm`,(segments)=>{
		readSurveys(`${prefix}-surveys.csv`,segments,(surveyedSegments)=>{
			surveyedSegmentsArray=[]
			surveyedSegments.forEach((surveyedSegment)=>{
				surveyedSegmentsArray.push(surveyedSegment)
			})
			fs.writeFile(`public_html/${prefix}-data.js`,'var data='+JSON.stringify(surveyedSegmentsArray))
		})
	})
}

const writeDistrict=(prefix,htmlName,title)=>{
	writeHtml(prefix,htmlName,title)
	writeData(prefix)
}

module.exports=(pages)=>{
	mkdirp('public_html',()=>{
		fs.createReadStream('map.js').pipe(fs.createWriteStream('public_html/map.js'))
		for (let page of pages) {
			writeDistrict(...page)
		}
	})
}
