
PhotoInput = function(options){

	options = options || {}
	options.parent = options.parent || document.body

	var div = document.createElement('div')
	div.classList.add('photo-input')
	options.parent.appendChild(div)
	
	// console.log('PhotoInput', options)
	function createElement(type, className){
		var el = document.createElement(type)
		if(className) { el.className = className }
		div.appendChild(el)
		return el
	}

	var camSelector = createElement('select')
	camSelector.addEventListener('change', init)

	var video = createElement('video')
	video.setAttribute('autoplay', '')

	var canvas = createElement('canvas')
	var ctx = canvas.getContext('2d')

	var snapBtn = createElement('button', 'snap')
	snapBtn.innerHTML = 'snap photo'
	snapBtn.addEventListener('click', snap)

	var acceptBtn = createElement('button', 'accept')
	acceptBtn.innerHTML = 'accept'
	acceptBtn.addEventListener('click', function(){
		post(options.postURL)
	})

	var discardBtn = createElement('button', 'discard')
	discardBtn.innerHTML = 'discard'
	discardBtn.addEventListener('click', function(){
		setState('capture')
		init()
	})

	var deviceList = {}

	var deviceListPromise = navigator.mediaDevices.enumerateDevices()
	deviceListPromise.then(handleDevices).catch(handleError)
	function handleDevices(devices){
		devices.forEach(function(device){
			console.log(device)
			if(device.kind === 'videoinput'){
				deviceList[device.label] = device.deviceId
			}
		})
		Object.keys(deviceList).forEach(function(deviceLabel){
			var option = document.createElement('option')
			option.text = deviceLabel
			camSelector.add(option)
		})
	}

	var stream;
	function handleStream(_stream){
		stream = _stream
		video.src = URL.createObjectURL(_stream)
	}

	function handleError(err){
		console.error(err)
	}

	function init(){

		// stop previous stream just in case
		if(stream) stream.getVideoTracks()[0].stop()

		var constraints = {
			audio: false,
			video: {
				mandatory: {
					sourceId: deviceList[camSelector.value]
				}
			}
		}
		navigator.webkitGetUserMedia(constraints, handleStream, handleError)
		setState('capture')
	}

	deviceListPromise.then(init)

	function setState(newState){
		div.setAttribute('state', newState)
	}

	function snap(){
		canvas.width = video.videoWidth
		canvas.height = video.videoHeight
		ctx.drawImage(video, 0, 0)
		setState('review')
		// turn off cam so peeps don't get paranoid
		stream.getVideoTracks()[0].stop()
	}

	function post(toURL){
		var data = new FormData()
		data.append('photo', canvas.toDataURL())

		var xhr = new XMLHttpRequest()
		xhr.open('POST', toURL, true)
		xhr.onload = function () {
			// do something to response
			console.log(this.responseText)
			if(options.onPostComplete) options.onPostComplete(this.responseText)
		}
		xhr.onerror = handleError
		xhr.send(data);
	}
	
	return {
		snap: snap,
		options: options,
		div: div,
		post: post,
		deviceList: deviceList
	}
}
