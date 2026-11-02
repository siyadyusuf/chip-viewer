import csv,json,re
rows=list(csv.DictReader(open('/workspace/chip_model_catalog.csv')))
disc=json.load(open('/workspace/chips.json'))['disclaimer']
items=[]
for n,r in enumerate(rows,1):
    vs=int(r['visual_score'])
    if vs<3: continue
    items.append(dict(id=f"{n:03d}-"+re.sub(r'[^a-z0-9]+','-',r['name'].lower()).strip('-'),name=r['name'],
      year=None if r['year'] in('','n/a') else r['year'],category=r['category'],chip=r['chip'],tier=r['era'].lower(),
      embedUrl=r['embed_url'],sourceUrl=r['url'],modelUrl=None,license=r['license'],safe=r['status']=='SAFE',
      author=r['author'],logo=r['logo_flag']=='Y',visualScore=vs))
items.sort(key=lambda i:(i['tier'],-i['visualScore']))
json.dump(dict(disclaimer=disc,categories=sorted({i['category'] for i in items}),items=items),open('src/data/chips.json','w'),indent=1)
print(len(items))
