"""Fetch the explicitly selected LemoLab samples, with attribution and pinned style docs."""
import argparse, concurrent.futures, hashlib, json, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COMMIT = '413a6bd6d78ebd3bdd5abaec9538a26867f890df'
RAW = f'https://raw.githubusercontent.com/lemomo-ai/lemo-opuscar/{COMMIT}'
REPO = 'https://github.com/lemomo-ai/lemo-opuscar'
CHOICES = [
    ('dark-keynote', '产品发布', '用克制的光影、产品界面与节奏鲜明的镜头，讲清一个新想法。', ['产品介绍', '功能发布', '品牌短片']),
    ('swiss-motion', '图形动效', '让文字、网格与几何图形跟着节拍，成为叙事的主角。', ['活动宣传', '品牌表达', '观点分享']),
    ('ink-wash', '东方美学', '以宣纸留白、墨色层次与流动笔触，展开一段有余韵的故事。', ['文化故事', '诗意叙事', '节日心意']),
    ('crayon-book', '手绘故事', '把小小的想象画进温暖的蜡笔世界，让故事慢慢发生。', ['儿童故事', '知识启蒙', '生活记录']),
    ('pixel-rpg', '像素世界', '用像素场景、角色与游戏叙事，带观众走进一段冒险。', ['游戏叙事', '创意短片', '成长回顾']),
]

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'ATELIER-video-catalog/1.0'})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--previews', action='store_true')
    parser.add_argument('--data-dir', default=str(ROOT / 'data'))
    args = parser.parse_args()
    catalog = ROOT / 'catalog/video'
    posters = ROOT / 'public/video-posters'
    catalog.mkdir(parents=True, exist_ok=True)
    posters.mkdir(parents=True, exist_ok=True)
    def one(choice):
        slug, category, description, uses = choice
        directory = catalog / 'styles' / slug
        directory.mkdir(parents=True, exist_ok=True)
        metadata = json.loads(fetch(f'{RAW}/styles/{slug}/style.json'))
        for filename, relative in [('STYLE.md', f'styles/{slug}/STYLE.md'), ('CREDITS', f'styles/{slug}/demo/CREDITS')]:
            (directory / filename).write_bytes(fetch(f'{RAW}/{relative}'))
        (posters / f'{slug}.jpg').write_bytes(fetch(f'{RAW}/styles/{slug}/poster.jpg'))
        video = f'{REPO}/releases/download/films/{slug}.mp4'
        if args.previews:
            dest = Path(args.data_dir) / 'video-previews' / f'{slug}.mp4'
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                content = fetch(video)
                if content[4:8] != b'ftyp':
                    raise ValueError(f'{slug}: invalid MP4')
                temp = dest.with_suffix('.partial')
                temp.write_bytes(content)
                temp.replace(dest)
            print(f'{slug}: preview {dest.stat().st_size // 1024} KiB', flush=True)
        return dict(slug=slug, name=metadata['cn'], english=metadata['en'], category=category,
                    description=description, uses=uses, film=metadata['film'], sampleDuration=metadata['dur'],
                    poster=f'/video-posters/{slug}.jpg', sampleUrl=video,
                    sourceUrl=f'{REPO}/tree/{COMMIT}/styles/{slug}', sourceCommit=COMMIT,
                    renderer='swiss-v1' if slug == 'swiss-motion' else None,
                    credit='LemoLab', license='CC BY 4.0', collectedBy='带熊猫去竹林')
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        styles = list(pool.map(one, CHOICES))
    (catalog / 'styles.json').write_text(json.dumps(styles, ensure_ascii=False, indent=2) + '\n')
    (catalog / 'UPSTREAM-LICENSE').write_bytes(fetch(f'{RAW}/LICENSE'))
    print('Saved five styles, pinned docs, posters and credits.', flush=True)

if __name__ == '__main__':
    main()
