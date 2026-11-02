import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
p.on('pageerror', e => console.log('PE', e.stack.slice(0,600))); p.on('response', r => r.status()>=400 && console.log(r.status(), r.url()))
await p.goto('http://localhost:5181/?chip=003-pcb-nvidia-rtx-4090-graphic-card'); await p.waitForTimeout(15000)
await p.screenshot({ path: 'screenshots/one.png' }); await b.close()
