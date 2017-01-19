const fs=require('fs')
const readline=require('readline')
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
			p: segment.nodes,
			t: surveyDate,
			c: surveyChangeset,
		}
		surveyedSegments.set(segmentName,surveyedSegment)
	}).on('close',()=>{
		callback(surveyedSegments)
	})
}

readSegments('segments.osm',(segments)=>{
	readSurveys('surveys.csv',segments,(surveyedSegments)=>{
		surveyedSegmentsArray=[]
		surveyedSegments.forEach((surveyedSegment)=>{
			surveyedSegmentsArray.push(surveyedSegment)
		})
		fs.writeFile('index.js','var data='+JSON.stringify(surveyedSegmentsArray))
	})
})
