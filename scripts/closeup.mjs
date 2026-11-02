import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
for (const [id, n, rot] of [['003-pcb-nvidia-rtx-4090-graphic-card', 'rtx4090', 0], ['006-processor-intel-core-i5-12400-cpu', 'i5-12400', 0]]) {
  const p = await ctx.newPage(); p.on('response', r => r.status()>=400 && console.log(r.status(), r.url()))
  await p.goto('http://localhost:5181/?chip=' + id); await p.waitForTimeout(4000)
  await p.waitForFunction(() => !document.body.innerText.includes('Loading'), null, { timeout: 90000 }); await p.waitForTimeout(2000)
  const c = await p.locator('canvas').boundingBox(); const cx = c.x + c.width/2, cy = c.y + c.height/2
  await p.screenshot({ path: `screenshots/${n}-full.png`, clip: c })
  await p.mouse.move(cx, cy)
  for (const lvl of [1,2,3]) { for (let i = 0; i < 2; i++) { await p.mouse.wheel(0, -200); await p.waitForTimeout(150) }
  await p.waitForTimeout(2500); await p.screenshot({ path: `screenshots/${n}-closeup${lvl}.png`, clip: c }) }
  await p.close()
}
await b.close()
