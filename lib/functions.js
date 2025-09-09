const axios = require('axios')

const getBuffer = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: 'get',
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        })
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const getGroupAdmins = (participants) => {
    let admins = []
    for (let i of participants) {
        if (i.admin !== null) admins.push(i.id)
    }
    return admins
}

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

const h2k = (eco) => {
    let lyrik = ['', 'K', 'M', 'B', 'T', 'P', 'E']
    let ma = Math.log10(Math.abs(eco)) / 3 | 0
    if (ma == 0) return eco
    let ppo = lyrik[ma]
    let scale = Math.pow(10, ma * 3)
    let scaled = eco / scale
    let formatt = scaled.toFixed(1)
    if (/\.0$/.test(formatt)) formatt = formatt.substr(0, formatt.length - 2)
    return formatt + ppo
}

const isUrl = (url) => {
    return url.match(
        new RegExp(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/,
            'gi'
        )
    )
}

const Json = (string) => {
    return JSON.stringify(string, null, 2)
}

const runtime = (seconds) => {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor(seconds % (3600 * 24) / 3600)
    const m = Math.floor(seconds % 3600 / 60)
    const s = Math.floor(seconds % 60)
    const dDisplay = d > 0 ? d + (d == 1 ? ' day, ' : ' days, ') : ''
    const hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : ''
    const mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : ''
    const sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : ''
    return dDisplay + hDisplay + mDisplay + sDisplay
}

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const fetchJson = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        })
        return res.data
    } catch (err) {
        return err
    }
}

module.exports = { 
    getBuffer, 
    getGroupAdmins, 
    getRandom, 
    h2k, 
    isUrl, 
    Json, 
    runtime, 
    sleep, 
    fetchJson 
}
