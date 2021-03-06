import React, { Component } from 'react';
import loaderIcon from "../../assets/player-loader.gif";


const color1 = '#FF00FF';               // this is bottom of the eq line
const rgba1 = '255, 0, 0';              // this is time position color

function getRandomColorPair() {
    const colorPairs = [
        ['#ca70ff', '#F50000'],
        ['#ad55e2', '#5b0091'],
        ['#d06ec2', '#0045b3'],
        ['#e9f0ff', '#0045b3'],
        ['#008be1', '#0082a7'],
        ['#9991b9', '#884c62'],
        ['#6a8f96', '#0b3339'],
        ['#3b5f66', '#23484e']
    ]

    return colorPairs[Math.floor(Math.random() * colorPairs.length)];
}


class Canvas extends Component {
    constructor(props) {
        super(props)

        this.state = {
            threadInUse: this.props.thread || 'worker', // 'main' or 'worker'
            audioContext: null,
            analyser: null,
            gainNode: null,
            currentSource: null,
            bufferLength: null,
            duration: 0,
            playing: false,
            javascriptNode: null,
            firstPlay: true,
            audioContextCreatedTime: 0,
            audioLoadOffsetTime: 0,
            audioCurrentTime: 0,
            updatedVolume: false,
            isLoadingSong: false,
            isLoadingFullSong: false,
            canLoadFullSong: true,
            playingFullMusic: false,
            audioStreamData: null,
            trackerEnabled: true,

            /**
             * Canvas Context
             */
            canvas: null,
            canvasContext: null,
            canvasWidth: null,
            canvasHeight: null,
            canvasScaleCoef: null,
            canvasCx: null,
            canvasCy: null,
            canvasCoord: null,
            canvasFirstDraw: true,
            canvasResized: false,

            framerTransformScale: false,
            framerCountTicks: 360,
            framerFrequencyData: [],
            framerTickSize: 10,
            framerPI: 360,
            framerIndex: 0,
            framerLoadingAngle: 0,
            framerMaxTickSize: null,
            framerTicks: null,

            scenePadding: 120,
            sceneMinSize: 740,
            sceneOptimiseHeight: 982,
            sceneInProcess: false,
            sceneRadius: 250,

            trackerInnerDelta: 20,
            trackerLineWidth: 7,
            trackerPrevAngle: 0.5,
            trackerAngle: 0,
            trackerAnimationCount: 10,
            trackerPressButton: false,
            trackerAnimatedInProgress: false,
            trackerAnimateId: null,
            trackerR: 226.5,

            timeControl: {
                textContent: '00:00'
            },

            initialFixedTicks: false
        }

        /**
         * functions
         */
        // @Player
        this.init = this.init.bind(this)
        this.loadSong = this.loadSong.bind(this)
        this.playSound = this.playSound.bind(this)
        this.startPlayer = this.startPlayer.bind(this)
        this.suspendSong = this.suspendSong.bind(this)
        this.resumeSong = this.resumeSong.bind(this)
        this.showPlayer = this.showPlayer.bind(this)
        // @Framer
        this.framerInit = this.framerInit.bind(this)
        this.framerDraw = this.framerDraw.bind(this)
        this.framerDrawTick = this.framerDrawTick.bind(this)
        this.framerDrawTicks = this.framerDrawTicks.bind(this)
        this.framerDrawEdging = this.framerDrawEdging.bind(this)
        this.framerGetTicks = this.framerGetTicks.bind(this)
        this.framerGetTickPoints = this.framerGetTickPoints.bind(this)
        this.framerSetLoadingPercent = this.framerSetLoadingPercent.bind(this)
        this.framerGetSize = this.framerGetSize.bind(this)
        // @Scene
        this.sceneInit = this.sceneInit.bind(this)
        this.startSceneRender = this.startSceneRender.bind(this)
        this.sceneRender = this.sceneRender.bind(this)
        this.sceneClear = this.sceneClear.bind(this)
        this.sceneDraw = this.sceneDraw.bind(this)
        // @Tracker
        this.trackerStartAnimation = this.trackerStartAnimation.bind(this)
        this.trackerStopAnimation = this.trackerStopAnimation.bind(this)
        this.trackerIsInsideOfSmallCircle = this.trackerIsInsideOfSmallCircle.bind(this)
        this.trackerIsOusideOfBigCircle = this.trackerIsOusideOfBigCircle.bind(this)
        // @Controls
        this.controlsDraw = this.controlsDraw.bind(this)
        this.controlsGetQuadrant = this.controlsGetQuadrant.bind(this)
        // @Miscs
        this.changeVolume = this.changeVolume.bind(this)
        this.getVolume = this.getVolume.bind(this)
        this.timeHandler = this.timeHandler.bind(this)
    }

    componentDidMount() {
        new Promise(resolve => this.canvasConfigure(resolve))
            .then(() => this.showPlayer())
    }

    componentWillUnmount() {
        if (this.state.audioContext) {
            this.suspendSong()
        }
        // we have problem here
        //this.state.audioWorker.terminate()
    }

    showPlayer() {
        this.framerSetLoadingPercent(1)
        this.sceneInit()
    }

    startPlayer() {
        this.init()
    }

    init() {
        try {
            // Fix up for prefixing
            window.AudioContext = window.AudioContext || window.webkitAudioContext
            const audioContext = new AudioContext()
            const audioContextCreatedTime = new Date()
            const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1)

            const analyser = audioContext.createAnalyser()
            const gainNode = audioContext.createGain()

            analyser.fftSize = 2048
            const bufferLength = analyser.frequencyBinCount
            const dataArray = new Uint8Array(bufferLength)

            javascriptNode.onaudioprocess = () => {
                analyser.getByteFrequencyData(this.state.framerFrequencyData) // For Bits
            }

            this.setState({
                audioContext,
                analyser,
                gainNode,
                dataArray,
                bufferLength,
                framerFrequencyData: dataArray,
                javascriptNode,
                audioContextCreatedTime
            }, () => {
                this.loadSong(`https://daorecords.io:8443/fetch?cid=${this.props.musicCID}`);
            })
        } catch (error) {
            console.error(error)
            console.error('Web Audio API is not supported in this browser')
        }
    }

    loadSong(url) {
        const { audioContext } = this.state
        let {
            audioContextCreatedTime,
            audioLoadOffsetTime
        } = this.state

        const request = new XMLHttpRequest()
        request.open('GET', url, true)
        request.responseType = 'arraybuffer'

        // Decode asynchronously
        request.onload = () => {
            audioContext.decodeAudioData(request.response, (buffer) => {
                const completeBuffer = buffer
                const currentSource = audioContext.createBufferSource()

                currentSource.buffer = completeBuffer
                this.setState({ currentSource }, () => {
                    this.playSound()
                    audioLoadOffsetTime = (new Date() - audioContextCreatedTime) / 1000

                    if (audioLoadOffsetTime > audioContext.currentTime) {
                        audioLoadOffsetTime = audioContext.currentTime
                    }

                    this.setState({
                        audioContextCreatedTime,
                        audioLoadOffsetTime,
                        playingFullMusic: true,
                        isLoadingSong: false
                    });

                    this.setUpOnEndEvent();
                })
            }, function (error) {
                console.error(error)
            })
        }
        request.send()
    }

    playSound(when = null, offset = null) {
        const {
            audioContext,
            analyser,
            gainNode,
            javascriptNode,
            currentSource,
            updatedVolume
        } = this.state

        const source = currentSource
        source.connect(analyser)
        analyser.connect(gainNode)
        gainNode.connect(audioContext.destination)
        javascriptNode.connect(audioContext.destination)

        // Set the start volume to 50%.
        if (gainNode && !updatedVolume) {
            gainNode.gain.value = 0.5
        }

        if (when && offset) {
            source.start(when, offset)
        } else {
            source.start(0)
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume()
        }

        this.setState({ playing: true })
    }

    suspendSong() {
        this.state.audioContext.suspend()
        this.setState({ playing: false })
    }

    resumeSong() {
        console.log("resume")
        const { firstPlay } = this.state
        if (firstPlay) {
            this.setState({ isLoadingSong: true })
            this.init()
            this.setState({ firstPlay: false })
        } else {
            this.state.audioContext.resume()
            this.setState({ playing: true })
        }
    }

    setUpOnEndEvent(){
        const { currentSource, audioContext } = this.state;
        currentSource.addEventListener('ended', () => {
            console.log("finished playing song");
            this.setState({ playing: false });
            this.trackerStopAnimation();
            audioContext.close();
            this.init();
        }, false);
    }

    canvasConfigure(resolve) {
        let { canvas, canvasContext } = this.state
        canvas = document.querySelector('#Player-canvas')
        canvasContext = canvas.getContext('2d')
        canvasContext.strokeStyle = color1

        this.setState({
            canvas,
            canvasContext
        }, () => {
            this.calculateSize(resolve)
        })
    }

    calculateSize(resolve) {
        let { canvas } = this.state
        const padding = 120
        const minSize = 740
        const optimiseHeight = 982

        const canvasScaleCoef = Math.max(0.5, 740 / optimiseHeight)

        const size = Math.max(minSize, 1 /*document.body.clientHeight */)
        canvas.setAttribute('width', size)
        canvas.setAttribute('height', size)

        const canvasWidth = size
        const canvasHeight = size

        const sceneRadius = (size - padding * 2) / 2
        const canvasCx = sceneRadius + padding
        const canvasCy = sceneRadius + padding
        const canvasCoord = canvas.getBoundingClientRect()

        this.setState({
            canvas,
            canvasWidth,
            canvasHeight,
            canvasScaleCoef,
            canvasCx,
            canvasCy,
            canvasCoord,
            sceneRadius
        }, () => resolve ? resolve() : null)
    }

    framerInit() {
        let {
            canvasScaleCoef,
            framerTickSize,
            framerCountTicks
        } = this.state

        const framerMaxTickSize = framerTickSize * 9 * canvasScaleCoef
        framerCountTicks = 360 * canvasScaleCoef

        this.setState({ framerCountTicks, framerMaxTickSize })
    }

    sceneInit() {
        this.sceneInitHandlers()

        this.framerInit()
        this.timeHandler()

        this.startSceneRender()

        setInterval(() => {
            this.timeHandler()
        }, 300)
    }

    sceneInitHandlers() {
        window.onresize = () => {
            this.canvasConfigure()
            this.framerInit()
            this.sceneRender()

            this.setState({ canvasResized: true })
        }
    }

    startSceneRender() {
        this.setState({ sceneInProcess: true })
        this.sceneRender()
    }

    sceneRender() {
        if (this.state.canvasFirstDraw || this.state.canvasResized) {
            this.sceneClear()
            this.sceneDraw()
            this.setState({ canvasFirstDraw: false, canvasResized: false })
        }

        requestAnimationFrame(() => {
            if (this.state.playing) {
                this.sceneClear()
                this.sceneDraw()
            }
            if (this.state.sceneInProcess) {
                this.sceneRender()
            }
        })
    }

    sceneClear() {
        const {
            canvasWidth,
            canvasHeight,
            canvasContext
        } = this.state

        canvasContext.clearRect(0, 0, canvasWidth, canvasHeight)
    }

    sceneDraw() {
        this.framerDraw()
        this.trackerDraw()
        this.controlsDraw()
    }

    controlsDraw() {
        const {
            canvasContext,
            trackerR,
            trackerAngle,
            sceneRadius,
            scenePadding,
            trackerEnabled,
        } = this.state

        if (trackerEnabled) {
            canvasContext.save()
            canvasContext.beginPath()
            canvasContext.fillStyle = 'rgba(' + rgba1 +', 0.85)'
            canvasContext.lineWidth = 1
            let x = trackerR / Math.sqrt(Math.pow(Math.tan(trackerAngle), 2) + 1)
            let y = Math.sqrt(trackerR * trackerR - x * x)
            if (this.controlsGetQuadrant() === 2) {
                x = -x
            }
            if (this.controlsGetQuadrant() === 3) {
                x = -x
                y = -y
            }
            if (this.controlsGetQuadrant() === 4) {
                y = -y
            }
            canvasContext.arc(sceneRadius + scenePadding + x, sceneRadius + scenePadding + y, 10, 0, Math.PI * 2, false)
            canvasContext.fill()
            canvasContext.restore()
        }
    }

    controlsGetQuadrant() {
        const { trackerAngle } = this.state

        if (0 <= trackerAngle && trackerAngle < Math.PI / 2) {
            return 1
        }
        if (Math.PI / 2 <= trackerAngle && trackerAngle < Math.PI) {
            return 2
        }
        if (Math.PI < trackerAngle && trackerAngle < Math.PI * 3 / 2) {
            return 3
        }
        if (Math.PI * 3 / 2 <= trackerAngle && trackerAngle <= Math.PI * 2) {
            return 4
        }
    }

    framerDraw() {
        this.framerDrawTicks()
        this.framerDrawEdging()
    }

    framerDrawTicks() {
        const { canvasContext } = this.state
        let { framerTicks } = this.state

        canvasContext.save()
        canvasContext.beginPath()
        canvasContext.lineWidth = 1
        framerTicks = this.framerGetTicks([0, 90])
        for (let i = 0, len = framerTicks.length; i < len; ++i) {
            const tick = framerTicks[i]
            this.framerDrawTick(tick.x1, tick.y1, tick.x2, tick.y2)
        }
        canvasContext.restore()

        this.setState({ framerTicks })
    }

    framerDrawTick(x1, y1, x2, y2) {
        const {
            canvasCx,
            canvasCy,
            canvasContext
        } = this.state
    
        const [colorStart, colorEnd] = getRandomColorPair();

        const dx1 = parseInt(canvasCx + x1)
        const dy1 = parseInt(canvasCy + y1)

        const dx2 = parseInt(canvasCx + x2)
        const dy2 = parseInt(canvasCy + y2)

        const gradient = canvasContext.createLinearGradient(dx1, dy1, dx2, dy2)
        gradient.addColorStop(0, colorStart)
        gradient.addColorStop(0.6, colorStart)
        gradient.addColorStop(1, colorEnd)
        canvasContext.beginPath()
        canvasContext.strokeStyle = gradient
        canvasContext.lineWidth = 2
        canvasContext.moveTo(canvasCx + x1, canvasCx + y1)
        canvasContext.lineTo(canvasCx + x2, canvasCx + y2)
        canvasContext.stroke()
    }

    framerGetTicks(animationParams) {
        this.setState({ framerTickSize: 10 })

        const {
            canvas,
            framerTickSize,
            framerFrequencyData,
            canvasScaleCoef,
            framerTransformScale,
            sceneRadius,
            initialFixedTicks
        } = this.state

        const ticks = this.framerGetTickPoints()
        let x1, y1, x2, y2, ticksArray = [], tick, k
        const lesser = 160
        const allScales = []
        for (let i = 0, len = ticks.length; i < len; ++i) {
            const coef = 1 - i / (len * 2.5)
            let delta = 0

            if (this.state.gainNode) {
                switch (this.state.gainNode.gain.value) {
                    case 0:
                        delta = 0
                        break

                    case 0.5:
                        delta = (((framerFrequencyData[i] || 0) - lesser * coef) * canvasScaleCoef) / 2
                        break

                    case 1:
                        delta = ((framerFrequencyData[i] || 0) - lesser * coef) * canvasScaleCoef
                        break

                    default:
                        delta = ((framerFrequencyData[i] || 0) - lesser * coef) * canvasScaleCoef
                        break
                }
            }

            if (delta < 0) {
                delta = 0
            }

            tick = ticks[i]
            if (initialFixedTicks) {
                if (animationParams[0] <= tick.angle && tick.angle <= animationParams[1]) {
                    k = sceneRadius / (sceneRadius - this.framerGetSize(tick.angle, animationParams[0], animationParams[1]) - delta)
                } else {
                    k = sceneRadius / (sceneRadius - (framerTickSize + delta))
                }
            } else {
                k = sceneRadius / (sceneRadius - (framerTickSize + delta))
            }
            x1 = tick.x * (sceneRadius - framerTickSize)
            y1 = tick.y * (sceneRadius - framerTickSize)
            x2 = x1 * k
            y2 = y1 * k
            ticksArray.push({ x1: x1, y1: y1, x2: x2, y2: y2 })
            if (i < 20) {
                let scale = delta / 50
                scale = scale < 1 ? 1 : scale
                allScales.push(scale)
            }
        }
        const sum = allScales.reduce((pv, cv) => { return pv + cv }, 0) / allScales.length
        if (framerTransformScale) {
            canvas.style.transform = `scale('${sum}')`
        }
        return ticksArray
    }

    framerGetSize(angle, l, r) {
        const {
            framerMaxTickSize,
            framerTickSize,
            framerIndex,
            framerCountTicks
        } = this.state
        const m = (r - l) / 2
        const x = (angle - l)
        let size

        if (x === m) {
            return framerMaxTickSize
        }
        const diameter = Math.abs(m - x)
        const v = 70 * Math.sqrt(1 / diameter)
        if (v > framerMaxTickSize) {
            size = framerMaxTickSize - diameter
        } else {
            size = Math.max(framerTickSize, v)
        }

        if (framerIndex > framerCountTicks) {
            this.setState({ framerIndex: 0 })
        }

        return size
    }

    framerGetTickPoints() {
        const {
            framerCountTicks,
            framerPI
        } = this.state
        const coords = [], step = framerPI / framerCountTicks

        for (let deg = 0; deg < framerPI; deg += step) {
            const rad = deg * Math.PI / (framerPI / 2)
            coords.push({ x: Math.cos(rad), y: -Math.sin(rad), angle: deg })
        }

        return coords
    }

    framerDrawEdging() {
        const {
            trackerLineWidth,
            trackerInnerDelta,
            canvasCx,
            canvasCy,
            sceneRadius,
            canvasContext,
            scenePadding,
            framerLoadingAngle
        } = this.state

        canvasContext.save()
        canvasContext.beginPath()
        canvasContext.strokeStyle = 'rgba(' + rgba1 + ', 0.5)'
        canvasContext.lineWidth = 1

        const offset = trackerLineWidth / 2
        canvasContext.moveTo(scenePadding + 2 * sceneRadius - trackerInnerDelta - offset, scenePadding + sceneRadius)
        canvasContext.arc(canvasCx, canvasCy, sceneRadius - trackerInnerDelta - offset, 0, framerLoadingAngle, false)

        canvasContext.stroke()
        canvasContext.restore()
    }

    framerSetLoadingPercent(percent) {
        this.setState({ framerLoadingAngle: percent * 2 * Math.PI })
    }

    trackerDraw() {
        const {
            currentSource,
            audioContext,
            trackerPressButton,
            audioLoadOffsetTime,
            isLoadingSong
        } = this.state

        if (currentSource !== null && this.state.trackerEnabled) {
            if (!currentSource.buffer) {
                return
            }

            if (!trackerPressButton) {
                const angle = (audioContext.currentTime - audioLoadOffsetTime) / currentSource.buffer.duration * 2 * Math.PI || 0
                this.setState({ trackerAngle: angle })
            }

            if (!isLoadingSong) {
                this.trackerDrawArc()
            }
        }
    }

    trackerDrawArc() {
        let {
            canvasContext,
            sceneRadius,
            trackerInnerDelta,
            scenePadding,
            trackerLineWidth,
            trackerAngle
        } = this.state

        canvasContext.save()
        canvasContext.strokeStyle = 'rgba(' + rgba1 +', 0.8)'
        canvasContext.beginPath()
        canvasContext.lineWidth = trackerLineWidth

        const trackerR = sceneRadius - (trackerInnerDelta + trackerLineWidth / 2)
        canvasContext.arc(
            sceneRadius + scenePadding,
            sceneRadius + scenePadding,
            trackerR, 0, trackerAngle, false
        )
        canvasContext.stroke()
        canvasContext.restore()
    }

    trackerStartAnimation() {
        const {
            trackerAnimationCount,
            trackerPrevAngle,
            trackerAngle
        } = this.state

        let angle = trackerAngle
        const l = Math.abs(trackerAngle) - Math.abs(trackerPrevAngle)
        let step = l / trackerAnimationCount, i = 0

        const calc = () => {
            angle += step
            if (++i === trackerAnimationCount) {
                this.setState({
                    trackerAngle: angle,
                    trackerPrevAngle: angle,
                    trackerAnimatedInProgress: false
                })
            } else {
                this.setState({ trackerAnimateId: setTimeout(calc, 20) })
            }
        }
    }

    trackerStopAnimation() {
        clearTimeout(this.state.trackerAnimateId)
        this.setState({ trackerAnimatedInProgress: false })
    }

    trackerCalculateAngle(event) {
        const {
            canvasCx,
            canvasCy,
            canvasCoord,
            canvasContext,
            animatedInProgress,
            trackerAngle,
            isLoadingSong
        } = this.state

        const mx = event.pageX
        const my = event.pageY
        let angle = Math.atan((my - canvasCy - canvasCoord.top) / (mx - canvasCx - canvasCoord.left))

        if (mx < canvasContext + canvasCoord.left) {
            angle = Math.PI + angle
        }
        if (angle < 0) {
            angle += 2 * Math.PI
        }

        this.setState({ trackerAngle: angle })

        if (animatedInProgress && !isLoadingSong) {
            this.trackerStartAnimation()
        } else {
            this.setState({ trackerPrevAngle: trackerAngle })
        }
    }

    trackerIsInsideOfSmallCircle(event) {
        let {
            canvasCx,
            canvasCy,
            canvasCoord,
            sceneRadius,
            trackerInnerDelta
        } = this.state

        const x = Math.abs(event.pageX - canvasCx - canvasCoord.left)
        const y = Math.abs(event.pageY - canvasCy - canvasCoord.top)

        return Math.sqrt(x * x + y * y) < sceneRadius - 3 * trackerInnerDelta
    }

    trackerIsOusideOfBigCircle(event) {
        let {
            canvasCx,
            canvasCy,
            canvasCoord,
            sceneRadius
        } = this.state
        return Math.abs(event.pageX - canvasCx - canvasCoord.left) > sceneRadius ||
            Math.abs(event.pageY - canvasCy - canvasCoord.top) > sceneRadius
    }

    timeHandler() {
        const {
            audioContext,
            audioLoadOffsetTime,
            currentSource
        } = this.state

        let {
            timeControl
        } = this.state

        let rawTime = 0

        if (audioContext && audioContext.state !== 'suspended' && currentSource) {
            let audioCurrentTime = audioContext.currentTime - audioLoadOffsetTime
            rawTime = parseInt(audioCurrentTime || 0)
            const currentTime = this.getFormattedTime(rawTime);
            const totalTime = this.getFormattedTime(currentSource.buffer.duration).substring(0, 5);
            timeControl.textContent = currentTime + " / " + totalTime;
        }
    }

    getFormattedTime(rawTime) {
        const secondsInMin = 60
        let min = parseInt(rawTime / secondsInMin)
        let seconds = rawTime - min * secondsInMin
        if (min < 10) {
            min = `0${min}`
        }
        if (seconds < 10) {
            seconds = `0${seconds}`
        }
        const time = `${min}:${seconds}`
        return time;
    }

    changeVolume() {
        let { gainNode } = this.state

        if (gainNode == null) {
            return
        }

        switch (gainNode.gain.value) {
            case 0:
                gainNode.gain.value = 0.5
                break

            case 0.5:
                gainNode.gain.value = 1
                break

            case 1:
                gainNode.gain.value = 0
                break

            default:
                break
        }

        this.setState({ gainNode, updatedVolume: true })
    }

    getVolume() {
        const { gainNode } = this.state

        if (gainNode == null) {
            return 1
        }

        return gainNode.gain.value
    }

    render() {
        return (
            <div className='Audio'>
                <div className='Player'>
                    <canvas id='Player-canvas' key='Player-canvas'></canvas>
                    <div className='controls'>
                        <div className='pause-play-song'>
                            {this.state.isLoadingSong
                                ? <img src={loaderIcon} className="player-loader"/>
                                : !this.state.playing
                                    ? <button onClick={this.resumeSong} className='playerButton'><PlayIcon /></button>
                                    : <button onClick={this.suspendSong}  className='playerButton'><PauseIcon  /></button>
                            }
                        </div>
                    </div>
                    <div className='song-footer' style={{display: "none"}}>
                        <div className='song-gain'>{
                            this.getVolume() === 0
                                ? <VolumeEmpty onClick={this.changeVolume} />
                                : this.getVolume() < 1
                                    ? <VolumeMinus style={{ cursor: 'pointer' }} onClick={this.changeVolume} />
                                    : <VolumePlus style={{ cursor: 'pointer' }} onClick={this.changeVolume} />
                        }
                        </div>
                        <div className='song-duration'>{this.state.timeControl.textContent}</div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Canvas


function PlayIcon() {
    return (
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.25 18.75L42.75 30L23.25 41.25V18.75Z" fill="#FFFFFF"/>
        <circle cx="30" cy="30" r="29.5" stroke="#FFFFFF"/>
      </svg>
    );
  }
  
  function PauseIcon() {
    return(
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 16H26V44H20V16Z" fill="#FFFFFF"/>
        <path d="M34 16H40V44H34V16Z" fill="#FFFFFF"/>
        <circle cx="30" cy="30" r="29.5" stroke="#FFFFFF"/>
      </svg>
    );
  }
  
  function VolumeEmpty() {
    return(
      <svg width="20" height="20" viewBox="0 0 10 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M8 0H10V20H8V18H6V16H8V4H6V2H8V0ZM4 6V4H6V6H4ZM2 8H4V6H2H0V8V12V14H2H4V16H6V14H4V12H2V8Z" fill="#FFFFFF"/>
      </svg>
    );
  }
  
  function VolumeMinus() {
    return (
      <svg width="8" height="8" viewBox="0 0 8 2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="8" height="2" fill="#FFFFFF"/>
      </svg>
    );
  }
  
  function VolumePlus() {
    return (
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M3 5V8H5V5H8V3H5V0H3V3H0V5H3Z" fill="#FFFFFF"/>
      </svg>
    );
  }