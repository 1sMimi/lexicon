"""Build reproducible, attributed ECDICT study packs; no commercial scraping."""
import argparse, csv, hashlib, json, pathlib, re, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / 'work/ecdict'
OUT = ROOT / 'public/data'
def fetch(url, path, raw=False):
    request = urllib.request.Request(url, headers={'Accept': 'application/vnd.github.raw+json' if raw else 'application/vnd.github+json', 'User-Agent':'Lexicon-dictionary-builder'})
    with urllib.request.urlopen(request, timeout=120) as response:
        path.write_bytes(response.read())
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--download',action='store_true');args=parser.parse_args()
    CACHE.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
    if args.download:
        fetch('https://api.github.com/repos/skywind3000/ECDICT/commits/master',CACHE/'commit.json')
        commit=json.loads((CACHE/'commit.json').read_text())['sha']
        for name,target in [('ecdict.csv',CACHE/'ecdict.csv'),('LICENSE',OUT/'ECDICT-LICENSE.txt')]:
            fetch(f'https://api.github.com/repos/skywind3000/ECDICT/contents/{name}?ref={commit}',target,True)
    commit=json.loads((CACHE/'commit.json').read_text())['sha']
    rows={}
    with (CACHE/'ecdict.csv').open(encoding='utf-8-sig',newline='') as stream:
        for row in csv.DictReader(stream):
            word=row['word'].strip().lower()
            if not re.fullmatch(r"[a-z]+(?:[-'][a-z]+)*",word):continue
            rank=int(row.get('bnc') or 0)
            rows.setdefault(word,dict(id=word,word=word,phonetic=row.get('phonetic',''),translation=row.get('translation','').replace('\\n','\n'),definition=row.get('definition','').replace('\\n','\n'),pos=row.get('pos',''),exchange=row.get('exchange',''),frequency=rank,tags=row.get('tag','').split()))
    frequency=sorted((r for r in rows.values() if r['frequency']>0),key=lambda r:(r['frequency'],r['word']))[:3000]
    books=[dict(id='frequency',name='High Frequency 3000',wordIds=[r['id'] for r in frequency],source='ECDICT BNC frequency rank; third-party corpus')]
    for tag,name in [('gre','GRE'),('toefl','TOEFL'),('ielts','IELTS')]:
        selected=sorted((r for r in rows.values() if tag in r['tags']),key=lambda r:(r['frequency'] or 999999,r['word']))
        books.append(dict(id=tag,name=name,wordIds=[r['id'] for r in selected],source=f'ECDICT {tag} tag; third-party list, not official or exhaustive'))
    ids={word for book in books for word in book['wordIds']}
    core=dict(words=[rows[w] for w in sorted(ids)],wordbooks=books)
    (OUT/'core.json').write_text(json.dumps(core,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    # Optional alphabetic packs keep the complete dictionary out of first launch.
    packs=[]
    for letter in 'abcdefghijklmnopqrstuvwxyz':
        words=[r for w,r in rows.items() if w.startswith(letter) and w not in ids]
        target=OUT/f'dictionary-{letter}.json';target.write_text(json.dumps(words,ensure_ascii=False,separators=(',',':')),encoding='utf-8');packs.append(dict(file=target.name,count=len(words),bytes=target.stat().st_size))
    provenance=dict(source='https://github.com/skywind3000/ECDICT',commit=commit,license='MIT',csvSha256=hashlib.sha256((CACHE/'ecdict.csv').read_bytes()).hexdigest(),selection='Lowercase ASCII lexical entries; High Frequency uses positive BNC rank; exam lists use exact source tags.',counts={b['name']:len(b['wordIds']) for b in books},coreWords=len(ids),packs=packs)
    (OUT/'provenance.json').write_text(json.dumps(provenance,indent=2),encoding='utf-8')
    print(json.dumps(provenance['counts']));print('core words:',len(ids))
if __name__=='__main__':main()
