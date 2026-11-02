import csv,json,re,os,shutil,sys
man={m['id']:m for m in json.load(open('/workspace/chip_models_opt/manifest.json'))}
# License-pending: excluded from PUBLIC build. Re-enable: python3 scripts/gen.py --include-pending
PENDING={'062','063','064','068','071','003','006'}  # 003,006: logos not yet covered
INC='--include-pending' in sys.argv
rows=list(csv.DictReader(open('/workspace/chip_model_catalog.csv')))
disc=json.load(open('/workspace/chips.json'))['disclaimer']
items=[]
for n,r in enumerate(rows,1):
    vs=int(r['visual_score'])
    if vs<3: continue
    items.append(dict(id=f"{n:03d}-"+re.sub(r'[^a-z0-9]+','-',r['name'].lower()).strip('-'),name=r['name'],
      year=None if r['year'] in('','n/a') else r['year'],category=r['category'],chip=r['chip'],tier=r['era'].lower(),
      embedUrl=r['embed_url'],sourceUrl=r['url'],modelUrl=None,licensePending=False,license=r['license'],safe=r['status']=='SAFE',
      author=r['author'],logo=r['logo_flag']=='Y',visualScore=vs))
os.makedirs('public/models',exist_ok=True)
for f in os.listdir('public/models'): os.remove('public/models/'+f)
out=[]
for i in items:
    p=i['id'][:3] in PENDING; i['licensePending']=p
    if p and not INC: continue
    m=man.get(i['id'])
    if m and m.get('downloaded') and m.get('file'):
        shutil.copy('/workspace/chip_models_opt/'+m['file'],'public/models/'+m['file']); i['modelUrl']=m['modelUrl']
    out.append(i)
items=out
items.sort(key=lambda i:(i['tier'],-i['visualScore']))
json.dump(dict(disclaimer=disc,categories=sorted({i['category'] for i in items}),items=items),open('src/data/chips.json','w'),indent=1)
print(len(items))
