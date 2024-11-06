const musicFileInput = document.getElementById('selectMusic')
const lyricFileInput = document.getElementById('selectLyric')
const audioPlayer = document.querySelector('audio')
const playButton = document.getElementById('play')
const spectrumCanvas = document.getElementById('spectrum')
const lyric_en = document.getElementById('lyric_en')
const lyric_zh = document.getElementById('lyric_zh')


const ctx = spectrumCanvas.getContext("2d")

const lyrics = []  // 歌词数据



function resizeSpectrumCanvas() {
    spectrumCanvas.width = window.innerWidth * 0.84 * devicePixelRatio
    spectrumCanvas.height = window.innerHeight *0.2 * devicePixelRatio
}

resizeSpectrumCanvas()

window.onresize = resizeSpectrumCanvas // 窗口变化时候重新设置canvas宽高




let analyser = null
let dataArray = null
const N = 2048


// 绘制音频频谱
function drawSpectrum() {
    requestAnimationFrame(drawSpectrum)

    analyser.getByteFrequencyData(dataArray)

    const len = 4
    const upperPartHeight = spectrumCanvas.height * 0.7
    const lowerPartHeight = spectrumCanvas.height * 0.3
    const barWidth = 4
    let barHeight = 0

    let x = 0, y = 0
    
    ctx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height)
    

    for (let i = 0; i < dataArray.length; i += len) {
        let amplitude = 0
        for(let j = 0; j < len; j++)
            amplitude += dataArray[i+j]
        
        amplitude /= len

        // 绘制上半部分
        ctx.fillStyle = '#fafafa'
        barHeight =  amplitude / 255 * upperPartHeight
        y = upperPartHeight - barHeight
        ctx.fillRect(x, y, barWidth, barHeight)    
        
        // 绘制下半部分
        ctx.fillStyle = '#b0b0b0'
        barHeight = amplitude / 255 * lowerPartHeight
        y = upperPartHeight
        ctx.fillRect(x, y, barWidth, barHeight)
        
        x += barWidth * 2
    }
}

// 监听音频状态变化
let lyricIndex = -1
audioPlayer.addEventListener('timeupdate', () => {
    const currentTime = Math.round(audioPlayer.currentTime * 1000) + 150
    
    for(let i = 0; i < lyrics.length; i++) {
        if(lyrics[i].time > currentTime) {
            lyricIndex = i - 1
            break
        }
    }

    if(lyricIndex >= 0) {
        lyric_en.textContent = lyrics[lyricIndex].lyric
        lyric_zh.textContent = lyrics[lyricIndex].translation
    }

})


audioPlayer.onplay = function() {
    let audctx = new AudioContext() // 创建音频上下文
    let source = audctx.createMediaElementSource(audioPlayer) // 创建音频源
    analyser = audctx.createAnalyser() // 创建音频分析器
    analyser.fftSize = N // 设置分析器大小, 必须为2^n次方
    
    dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    source.connect(analyser) // 音频源连接到音频分析器
    analyser.connect(audctx.destination) // 音频分析器连接到音频输出

    drawSpectrum()
}



// 打开歌曲文件
musicFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
        audioPlayer.src = event.target.result
    }

    reader.readAsDataURL(file)
})


// 打开歌词文件
lyricFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0]
    const reader = new FileReader()

    reader.onload = () => {
        const fileContent = reader.result
        
        const matchs = fileContent.matchAll(/\[(\d{2}):(\d{2})\.(\d{3})\](.+?)\((.+?)\)/g)

        for(const match of matchs) {
            const minutes = parseInt(match[1])
            const seconds = parseInt(match[2])
            const milliseconds = parseInt(match[3])
            const time = minutes * 60000 + seconds * 1000 + milliseconds
            const lyric = match[4].trim()
            const translation = match[5].trim()

            lyrics.push({ time, lyric, translation })
        }
        lyrics.push({ time: 1e7, lyric: "", translation: "" })
    }   

    reader.readAsText(file)
})


// 播放 / 暂停

const pause = () => audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause()

playButton.addEventListener('click', pause)

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space')
        pause()
})
