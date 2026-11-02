import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const errs=[]
for (const [n, vp] of [['desktop-1440x900', { width: 1440, height: 900 }], ['mobile-390x844', { width: 390, height: 844 }]]) {
  const p = await (await b.newContext({ viewport: vp, colorScheme: 'dark' })).newPage()
  p.on('pageerror', e => errs.push(e.message))
  await p.goto('http://localhost:5180'); await p.waitForTimeout(6000)
  const c = await p.textContent('[aria-live]')
  await p.getByRole('button',{name:'Legacy',exact:true}).click(); const l = await p.textContent('[aria-live]')
  await p.check('input[type=checkbox]'); const lr = await p.textContent('[aria-live]')
  await p.getByRole('button',{name:'Current',exact:true}).click(); const cr = await p.textContent('[aria-live]')
  await p.uncheck('input[type=checkbox]'); await p.waitForTimeout(4000)
  console.log(n, {c,l,lr,cr})
  await p.screenshot({ path: `screenshots/${n}.png`, fullPage: n.startsWith('mobile') })
}
console.log('errors', errs); await b.close()
