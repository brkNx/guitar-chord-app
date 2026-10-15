import type { Song } from '../types/guitar';

export const SAMPLE_SONGS: Song[] = [
  {
    id: 'akdeniz-aksamlari',
    title: 'Akdeniz Akşamları',
    artist: 'Haluk Levent',
    key: 'Am',
    capo: 0,
    tempo: 95,
    difficulty: 'Kolay',
    tags: ['Klasik', 'Türkçe Rock', 'Akustik'],
    content: `{title: Akdeniz Akşamları}
{artist: Haluk Levent}
{key: Am}

{c: Giriş}
[Am]    [C]    [G]    [Am]

{c: Kıta 1}
[Am]Akdeniz akşamları [C]bir başka oluyor
[G]Hele bir de aylardan [Am]aşk olursa
[Am]Akdeniz akşamları [C]bir başka oluyor
[G]Hele bir de aylardan [Am]aşk olursa

{c: Nakarat}
[Am]Bir başka kayıyor [C]yıldızlar
[G]Bir başka parıldıyor [Am]ay
[Am]Bir başka kayıyor [C]yıldızlar
[G]Bir başka parıldıyor [Am]ay

{c: Kıta 2}
[Am]Gözlerin gözlerime [C]değdiği an
[G]Akdeniz susuyor [Am]zaman duruyor
[Am]Gözlerin gözlerime [C]değdiği an
[G]Akdeniz susuyor [Am]zaman duruyor

{c: Çıkış}
[Am]    [C]    [G]    [Am]`
  },
  {
    id: 'haberin-yok-oluyorum',
    title: 'Haberin Yok Ölüyorum',
    artist: 'Duman',
    key: 'Em',
    capo: 0,
    tempo: 110,
    difficulty: 'Kolay',
    tags: ['Türkçe Rock', 'Duman', 'Akustik'],
    content: `{title: Haberin Yok Ölüyorum}
{artist: Duman}
{key: Em}

{c: Giriş}
[Em]    [G]    [D]    [Am]

{c: Kıta 1}
[Em]Sensiz ben [G]nefes alamam
[D]Buralarda hiç [Am]duramam
[Em]Tek başıma [G]yalnız kalamam
[D]Senin kokunu [Am]özlerim

{c: Nakarat}
[C]Haberin yok [G]ölüyorum
[D]Kör kuyularda [Em]görüyorum
[C]Haberin yok [G]ölüyorum
[D]Sen diye aşkı [Em]biliyorum

{c: Kıta 2}
[Em]Geceler [G]sabah olmuyor
[D]Gözlerim uyku [Am]tutmuyor
[Em]Yüreğim sensiz [G]çarpmıyor
[D]Aşkın içimden [Am]gitmiyor`
  },
  {
    id: 'gulpembe',
    title: 'Gülpembe',
    artist: 'Barış Manço',
    key: 'Am',
    capo: 0,
    tempo: 100,
    difficulty: 'Orta',
    tags: ['Anadolu Rock', 'Efsane', 'Barış Manço'],
    content: `{title: Gülpembe}
{artist: Barış Manço}
{key: Am}

{c: Giriş}
[Am]    [Dm]    [G]    [C]    [E7]

{c: Kıta 1}
[Am]Sen gülünce güller açar [Dm]Gülpembe
[G]Bülbüller seni dinler [C]aheste [E7]
[Am]Rüzgar fısıldar adını [Dm]geceleri
[F]Gözlerin aydınlatır [E7]kalpleri

{c: Nakarat}
[Dm]Gülpembe [G]ah Gülpembe
[C]Uzaklarda bir yerlerde [Am]bekle
[Dm]Gülpembe [E7]ah Gülpembe
[Am]Unutmadık seni biz yine`
  },
  {
    id: 'paramparca',
    title: 'Paramparça',
    artist: 'Teoman',
    key: 'Am',
    capo: 0,
    tempo: 115,
    difficulty: 'Kolay',
    tags: ['Rock', 'Teoman'],
    content: `{title: Paramparça}
{artist: Teoman}
{key: Am}

{c: Giriş}
[Am]    [F]    [C]    [G]

{c: Kıta 1}
[Am]Saatler durdu sanki [F]birdenbire
[C]Şehir kayboldu [G]sisler içinde
[Am]Ben yine aynı [F]köşebaşında
[C]Beklerim seni [G]yağmur altında

{c: Nakarat}
[F]Bugün benim doğum günüm [G]hem sarhoşum hem yastayım
[Am]Bir bar taburesi üstünde [Em]babamın öldüğü yaştayım
[F]Bugün benim doğum günüm [G]kelimeler büyüyor ağzımda
[Am]Bildiğim tüm şarkılar [Em]paramparça`
  },
  {
    id: 'knockin-on-heavens-door',
    title: "Knockin' on Heaven's Door",
    artist: 'Bob Dylan',
    key: 'G',
    capo: 0,
    tempo: 70,
    difficulty: 'Kolay',
    tags: ['Classic Rock', 'Acoustic', 'English'],
    content: `{title: Knockin' on Heaven's Door}
{artist: Bob Dylan}
{key: G}

{c: Intro}
[G]    [D]    [Am]
[G]    [D]    [C]

{c: Verse 1}
[G]Mama take this [D]badge off of [Am]me
[G]I can't [D]use it any[C]more
[G]It's gettin' [D]dark, too dark for me to [Am]see
[G]I feel I'm [D]knockin' on heaven's [C]door

{c: Chorus}
[G]Knock, knock, [D]knockin' on heaven's [Am]door
[G]Knock, knock, [D]knockin' on heaven's [C]door
[G]Knock, knock, [D]knockin' on heaven's [Am]door
[G]Knock, knock, [D]knockin' on heaven's [C]door`
  },
  {
    id: 'wonderwall',
    title: 'Wonderwall',
    artist: 'Oasis',
    key: 'Em',
    capo: 2,
    tempo: 87,
    difficulty: 'Kolay',
    tags: ['Britpop', 'Oasis', 'Capo 2'],
    content: `{title: Wonderwall}
{artist: Oasis}
{key: Em}
{capo: 2}

{c: Intro}
[Em]    [G]    [D]    [A7]

{c: Verse 1}
[Em]Today is gonna be the day that they're [G]gonna throw it back to you
[D]By now you should've somehow realized [A7]what you gotta do
[Em]I don't believe that anybody [G]feels the way I do
About you [D]now [A7]

{c: Chorus}
[C]And all the roads that [D]lead you there were [Em]winding
[C]And all the lights that [D]lead the way are [Em]blinding
[C]Because maybe [D]you're gonna be the one that [Em]saves me
And after [C]all [Em]you're my [G]wonderwall`
  }
];
