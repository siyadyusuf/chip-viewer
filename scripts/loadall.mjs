import { chromium } from 'playwright'
import fs from 'fs'
const d = JSON.parse(fs.readFileSync('src/data/chips.json')).items.filter(i => i.modelUrl)
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
const fails = []; const exts = {}
for (const c of d) {
  const p = await ctx.newPage(); const errs = []
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()))
  await p.goto('http://localhost:5181/?chip=' + c.id)
  try { await p.waitForSelector('canvas', { timeout: 20000 }); await p.waitForFunction(() => !document.body.innerText.includes('Loading'), null, { timeout: 60000 }) } catch (e) { errs.push('timeout') }
  await p.waitForTimeout(1500)
  if (errs.length) fails.push({ id: c.id, errs })
  console.log(c.id, errs.length ? 'FAIL ' + errs.join(' | ').slice(0, 200) : 'ok')
  await p.close()
}
console.log('FAILS', JSON.stringify(fails)); await b.close()
