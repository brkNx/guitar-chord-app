import type { Song } from '../types/guitar';

export const SAMPLE_SONGS: Song[] = [
  {
    id: 'sufle-pus',
    title: 'Pus (Kalacak Yüzün Var Mı)',
    artist: 'Sufle',
    key: 'Bm',
    capo: 0,
    tempo: 96,
    difficulty: 'Orta',
    youtubeId: 'XgdUYLzsVcI',
    tags: ['Akustik', 'Sufle', 'Pop Rock', 'YouTube'],
    timings: [
      // Giriş / Akustik İntro (0.0s - 7.0s)
      { time: 0.0, chord: 'Bm' },
      { time: 1.8, chord: 'D' },
      { time: 3.4, chord: 'G' },
      { time: 5.0, chord: 'Em' },
      { time: 6.2, chord: 'F#' },

      // Kıta (7.2s - 27.5s)
      { time: 7.2, chord: 'Bm' },  // "Pus, dağılmaz mı yine"
      { time: 12.0, chord: 'D' },  // "dağılmaz mı kuşlar"
      { time: 17.0, chord: 'G' },  // "Gözümü kapattım ve hep biter mi aşklar"
      { time: 22.5, chord: 'Em' }, // "Diye soramadım,"
      { time: 25.5, chord: 'F#' }, // "ah"

      // Nakarat (28.0s - 1:18.0)
      { time: 28.0, chord: 'Bm' }, // "Diyecek sözün var mı,"
      { time: 33.2, chord: 'D' },  // "kapıda gözün var mı"
      { time: 38.5, chord: 'G' },  // "Kalacak kalacak"
      { time: 43.5, chord: 'Em' }, // "kalacak yüzün"
      { time: 46.5, chord: 'F#' }, // "var mı"
      { time: 51.5, chord: 'Bm' }, // "Şimdi gidersen"
      { time: 56.8, chord: 'D' },  // "diye diye tıkandım"
      { time: 62.2, chord: 'G' },  // "Arkama baktım sevgilim"
      { time: 67.5, chord: 'Em' }, // "nerde kaldın"
      { time: 70.5, chord: 'F#' }, // "nerde kaldın (ara)"
      { time: 73.5, chord: 'Bm' }, // "Sözlerine inanmıştım"
      { time: 77.0, chord: 'D' },  // "başka gözlerde"
      { time: 79.5, chord: 'G' },  // "Çok aramıştım"
      { time: 81.8, chord: 'Em' }, // "seni"
      { time: 83.2, chord: 'F#' }, // "seni (bitiş)"

      // Çıkış / Bitiş (84.0s - 86.0s)
      { time: 84.0, chord: 'Bm' },
      { time: 84.8, chord: 'D' },
      { time: 85.4, chord: 'G' },
      { time: 85.8, chord: 'Bm' },
    ],
    content: `{title: Pus (Kalacak Yüzün Var Mı)}
{artist: Sufle}
{key: Bm}
{capo: 0}
{tempo: 96}

{c: Giriş / Akustik İntro}
[Bm]    [D]    [G]    [Em] [F#]

{c: Kıta}
[Bm]Pus, dağılmaz mı yine [D]dağılmaz mı kuşlar
[G]Gözümü kapattım ve hep biter mi aşklar
[Em]Diye soramadım, [F#]ah

{c: Nakarat}
[Bm]Diyecek sözün var mı, [D]kapıda gözün var mı
[G]Kalacak kalacak [Em]kalacak yüzün [F#]var mı
[Bm]Şimdi gidersen [D]diye diye tıkandım
[G]Arkama baktım sevgilim [Em]nerde kaldın [F#]
[Bm]Sözlerine inanmıştım [D]başka gözlerde
[G]Çok aramıştım [Em]seni [F#]

{c: Çıkış / Bitiş}
[Bm]    [D]    [G]    [Bm]`,
  },
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
[Am]    [G]    [F]    [E]
[Am]    [G]    [F]    [E]

{c: Kıta 1}
[Am]Akdeniz akşamları [G]bir başka oluyor
[F]Hele bir de aylardan [E]temmuz ise bambaşka
[Am]Sahilde insanlar [G]kol kola sımsıcak
[F]Coşmamak elde mi [E]böyle bir akşamda

{c: Nakarat}
[Am]İşte ben böyle [G]bir akşamda aşık oldum
[F]Aşık oldum [E]sırılsıklam
[Am]Gördüğüm o güzel [G]gözlere vuruldum
[F]O gece [E]sabaha kadar

{c: Kıta 2}
[Am]Akdeniz akşamları [G]bir başka oluyor
[F]Hele bir de aylardan [E]temmuz ise bambaşka
[Am]Sahilde insanlar [G]kol kola sımsıcak
[F]Coşmamak elde mi [E]böyle bir akşamda

{c: Nakarat}
[Am]İşte ben böyle [G]bir akşamda aşık oldum
[F]Aşık oldum [E]sırılsıklam
[Am]Gördüğüm o güzel [G]gözlere vuruldum
[F]O gece [E]sabaha kadar

{c: Çıkış}
[Am]    [G]    [F]    [E]    [Am]`
  },
  {
    id: 'senden-daha-guzel',
    title: 'Senden Daha Güzel',
    artist: 'Duman',
    key: 'Am',
    capo: 0,
    tempo: 112,
    difficulty: 'Kolay',
    tags: ['Türkçe Rock', 'Duman', 'Klasik'],
    content: `{title: Senden Daha Güzel}
{artist: Duman}
{key: Am}

{c: Giriş}
[Am]    [Am]    [B]    [B]
[Am]    [Am]    [B]    [B]

{c: Kıta 1}
[Am]Kimseyi görmedim [B]ben
Senden daha [Am]güzel
Kimseyi tanımadım [B]ben
Senden daha [Am]özel
Kimselere de [B]bakmadım
Aklımdan [Am]geçer
Kimseyi tanımadım [B]ben
Senden daha [Am]güzel

{c: Nakarat}
Senden daha [Am]güzel    [B]
Senden daha [Am]güzel    [B]
Senden daha [Am]güzel    [B]
Senden daha [Am]güzeeel  [B]

{c: Kıta 2}
[Am]Sana nerden [B]rastladım
Oldum [Am]derbeder
Kendimi sana [B]sakladım
Senden daha [Am]güzel
Kimseleri de [B]takmadım
Ölsem [Am]değişmem
Kimseyi tanımadım [B]ben
Senden daha [Am]güzel

{c: Nakarat}
Senden daha [Am]güzel    [B]
Senden daha [Am]güzel    [B]
Senden daha [Am]güzel    [B]
Senden daha [Am]güzeeel  [B]

{c: Çıkış}
[Am]    [B]    [Am]    [B]    [Am]`
  },
  {
    id: 'haberin-yok-oluyorum',
    title: 'Haberin Yok Ölüyorum',
    artist: 'Duman',
    key: 'C#m',
    capo: 0,
    tempo: 115,
    difficulty: 'Orta',
    youtubeId: 'fgBihaM6va4',
    tags: ['Türkçe Rock', 'Duman', 'Klasik'],
    content: `{title: Haberin Yok Ölüyorum}
{artist: Duman}
{key: C#m}
{tempo: 115}

{c: Giriş}
[C#m]    [B]    [C#m]    [B]

{c: Kıta 1}
[C#m]Bakma bana öyle derin işim olmaz senle benim
[C#m]Hiç bu kadar sevilmedin gözlerinden okuyorum
[E]Haberin yok [G#m]ölüyorum [C#m]vay

{c: Kıta 2}
[C#m]Sorma bana nerelisin ne içersin ne giyersin
[C#m]Derdim sana derman olsun ben gönülden okuyorum
[E]Haberin yok [G#m]ölüyorum [C#m]vay

{c: Kıta 3}
[C#m]Azdı yine deli gönül üzerine geliyorum
[C#m]Geçti yine boş bir ömür gözlerinden öpüyorum
[E]Haberin yok [G#m]ölüyorum [C#m]vay
[E]Haberin yok [G#m]ölüyorum [C#m]vay

{c: Nakarat}
[F#m]Haberin yok [A]ben ölüyorum [C#m]sen gelirken
[E]Ben [G#m]gidiyorum
[F#m]Dermanım yok [A]ben ölüyorum [C#m]ayrılırken
[E]Ben [G#m]içiyorum
[F#m]Haberin yok [A]ben ölüyorum [C#m]...

{c: Çıkış}
[C#m]    [B]    [E]    [G#m]    [C#m]`
  },
  {
    id: 'gulpembe',
    title: 'Gülpembe',
    artist: 'Barış Manço',
    key: 'Am',
    capo: 0,
    tempo: 98,
    difficulty: 'Orta',
    tags: ['Anadolu Rock', 'Efsane', 'Barış Manço'],
    content: `{title: Gülpembe}
{artist: Barış Manço}
{key: Am}

{c: Giriş}
[Am]    [Dm]    [G]    [C]
[F]     [Dm]    [E]    [Am]

{c: Kıta 1}
[Am]Sen gülünce [Dm]güller açar [G]Gülpembe
[C]Bülbüller [F]seni söyler [Dm]biz dinlerdik [E]Gülpembe
[Am]Sen gelince [Dm]bahar gelir [G]Gülpembe
[C]Dereler [F]seni çağlar [Dm]sevinirdik [E]Gülpembe

{c: Nakarat}
[Dm]Güz yağmurlarıyla [G]bir gün göçtün [C]gittin [F]inanamadık [Dm]Gülpembe [E]
[Dm]Bizim iller [G]sessiz bizim [C]iller [F]sensiz [Dm]olamadı [E]Gülpembe [Am]

{c: Kıta 2}
[Am]Dudağımda [Dm]son bir türkü [G]Gülpembe
[C]Hala hep [F]seni söyler [Dm]seni çağırır [E]Gülpembe
[Am]Gözlerimde [Dm]son bir bulut [G]Gülpembe
[C]Hala hep [F]seni arar [Dm]seni bekler [E]Gülpembe

{c: Nakarat}
[Dm]Güz yağmurlarıyla [G]bir gün göçtün [C]gittin [F]inanamadık [Dm]Gülpembe [E]
[Dm]Bizim iller [G]sessiz bizim [C]iller [F]sensiz [Dm]olamadı [E]Gülpembe [Am]

{c: Çıkış}
[Am]    [Dm]    [G]    [C]    [F]    [Dm]    [E]    [Am]`
  },
  {
    id: 'paramparca',
    title: 'Paramparça',
    artist: 'Teoman',
    key: 'Bm',
    capo: 0,
    tempo: 108,
    difficulty: 'Kolay',
    youtubeId: '_nE8f6q8ZYA',
    tags: ['Rock', 'Teoman', 'Klasik'],
    content: `{title: Paramparça}
{artist: Teoman}
{key: Bm}
{tempo: 108}

{c: Giriş}
[Bm]    [Em]    [Bm]    [F#]    [Bm]

{c: Kıta 1}
[Bm]Saatim yok tam olarak bilemem
[Em]Biraz bira biraz şarap önceydi
[Bm]Nasıl oluyor vakit bir türlü geçmezken
[F#]Yıllar hayatlar [Bm]geçiyor

{c: Kıta 2}
[Bm]Kayıp bir bavul gibiyim hava alanında
[Em]Ya da boş bir yüzme havuzu son baharda
[Bm]Çok mu ayıp hala mutluluk istemek
[F#]Neyse zaten hiç [Bm]halim yok

{c: Nakarat}
[Em]Bugün benim doğum günüm
[Bm]Hem sarhoşum hem yastayım
[F#]Bir bar taburesi üstünde
[Bm]Babamın öldüğü yaştayım
[Em]Bugün benim doğum günüm
[Bm]Kelimeler büyüyor ağzımda
[F#]Bildiğim tüm hayatlar
[Bm]Paramparça [F#]aaa paramparça [Bm]

{c: Kıta 3}
[Bm]Takatım yok yine de telefona sarıldım
[Em]Son bir özür için tüm sevdiğim kadınlardan
[Bm]Aradım mesajlar çıktı kapattım
[F#]Telesekretere konuşamayan[Bm]lardanım

{c: Nakarat}
[Em]Bugün benim doğum günüm
[Bm]Hem sarhoşum hem yastayım
[F#]Bir bar taburesi üstünde
[Bm]Babamın öldüğü yaştayım
[Em]Bugün benim doğum günüm
[Bm]Kelimeler büyüyor ağzımda
[F#]Bildiğim tüm hayatlar
[Bm]Paramparça [F#]aaa paramparça [Bm]

{c: Çıkış}
[Bm]    [Em]    [Bm]    [F#]    [Bm]`
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
[G]Knock, knock, [D]knockin' on heaven's [C]door

{c: Verse 2}
[G]Mama put my [D]guns in the [Am]ground
[G]I can't [D]shoot them any[C]more
[G]That long black [D]cloud is comin' [Am]down
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
[Em7]    [G]    [Dsus4]    [A7sus4]

{c: Verse 1}
[Em7]Today is gonna be the day that they're [G]gonna throw it back to you
[Dsus4]By now you should've somehow realized [A7sus4]what you gotta do
[Em7]I don't believe that anybody [G]feels the way I do
About you [Dsus4]now [A7sus4]

{c: Chorus}
[Cadd9]And all the roads that [Dsus4]lead you there were [Em7]winding
[Cadd9]And all the lights that [Dsus4]lead the way are [Em7]blinding
[Cadd9]Because maybe [Dsus4]you're gonna be the one that [G]saves [D/F#]me [Em7]
And after [Cadd9]all [Dsus4]you're my [Em7]wonderwall

{c: Verse 2}
[Em7]Back beat, the word is on the street that the [G]fire in your heart is out
[Dsus4]I'm sure you've heard it all before, but you [A7sus4]never really had a doubt
[Em7]I don't believe that anybody [G]feels the way I do
About you [Dsus4]now [A7sus4]

{c: Chorus}
[Cadd9]And all the roads that [Dsus4]lead you there were [Em7]winding
[Cadd9]And all the lights that [Dsus4]lead the way are [Em7]blinding
[Cadd9]Because maybe [Dsus4]you're gonna be the one that [G]saves [D/F#]me [Em7]
And after [Cadd9]all [Dsus4]you're my [Em7]wonderwall`
  }
];
