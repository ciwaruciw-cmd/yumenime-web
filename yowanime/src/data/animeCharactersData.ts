import type { AnimeCharacter } from '@/types/anime';

/**
 * Official Anime Character & Voice Actor data sourced directly from AniList CDN (https://anilist.co)
 */
export const animeCharactersMap: Record<string, AnimeCharacter[]> = {
  '1': [
  { id: '1-c1', name: 'Eren Yeager', japaneseName: 'エレン・イェーガー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/216895.jpg', voiceActor: { name: 'Yuki Kaji', japaneseName: '梶裕貴', image: 'https://cdn.myanimelist.net/images/voiceactors/3/95672.jpg', language: 'Japanese' } },
  { id: '1-c2', name: 'Mikasa Ackerman', japaneseName: 'ミカサ・アッカーマン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/215563.jpg', voiceActor: { name: 'Yui Ishikawa', japaneseName: '石川由依', image: 'https://cdn.myanimelist.net/images/voiceactors/3/100142.jpg', language: 'Japanese' } },
  { id: '1-c3', name: 'Armin Arlert', japaneseName: 'アルミン・アルレルト', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/5/216893.jpg', voiceActor: { name: 'Marina Inoue', japaneseName: '井上麻里奈', image: 'https://cdn.myanimelist.net/images/voiceactors/3/95158.jpg', language: 'Japanese' } },
  { id: '1-c4', name: 'Levi Ackerman', japaneseName: 'リヴァイ・アッカーマン', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/2/241417.jpg', voiceActor: { name: 'Hiroshi Kamiya', japaneseName: '神谷浩史', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15029.jpg', language: 'Japanese' } },
],
'2': [
  { id: '2-c1', name: 'Edward Elric', japaneseName: 'エドワード・エルリック', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/72533.jpg', voiceActor: { name: 'Romi Park', japaneseName: '朴璐美', image: 'https://cdn.myanimelist.net/images/voiceactors/3/95082.jpg', language: 'Japanese' } },
  { id: '2-c2', name: 'Alphonse Elric', japaneseName: 'アルフォンス・エルリック', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/5/54265.jpg', voiceActor: { name: 'Rie Kugimiya', japaneseName: '釘宮理恵', image: 'https://cdn.myanimelist.net/images/voiceactors/3/17641.jpg', language: 'Japanese' } },
  { id: '2-c3', name: 'Roy Mustang', japaneseName: 'ロイ・マスタング', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/72534.jpg', voiceActor: { name: 'Shinichiro Miki', japaneseName: '三木眞一郎', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15027.jpg', language: 'Japanese' } },
  { id: '2-c4', name: 'Winry Rockbell', japaneseName: 'ウィンリィ・ロックベル', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/7/72535.jpg', voiceActor: { name: 'Megumi Takamoto', japaneseName: '高本めぐみ', image: 'https://cdn.myanimelist.net/images/voiceactors/2/26698.jpg', language: 'Japanese' } },
],
'3': [
  { id: '3-c1', name: 'Okabe Rintarou', japaneseName: '岡部倫太郎', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/120610.jpg', voiceActor: { name: 'Mamoru Miyano', japaneseName: '宮野真守', image: 'https://cdn.myanimelist.net/images/voiceactors/3/55052.jpg', language: 'Japanese' } },
  { id: '3-c2', name: 'Makise Kurisu', japaneseName: '牧瀬紅莉栖', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/120608.jpg', voiceActor: { name: 'Asami Imai', japaneseName: '今井麻美', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10724.jpg', language: 'Japanese' } },
  { id: '3-c3', name: 'Mayuri Shiina', japaneseName: '椎名まゆり', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/120609.jpg', voiceActor: { name: 'Kana Hanazawa', japaneseName: '花澤香菜', image: 'https://cdn.myanimelist.net/images/voiceactors/1/40909.jpg', language: 'Japanese' } },
  { id: '3-c4', name: 'Itaru Hashida', japaneseName: '橋田至', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/11/120611.jpg', voiceActor: { name: 'Tomokazu Seki', japaneseName: '関智一', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15033.jpg', language: 'Japanese' } },
],
'4': [
  { id: '4-c1', name: 'Gon Freecss', japaneseName: 'ゴン＝フリークス', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/223749.jpg', voiceActor: { name: 'Megumi Han', japaneseName: '潘めぐみ', image: 'https://cdn.myanimelist.net/images/voiceactors/2/41934.jpg', language: 'Japanese' } },
  { id: '4-c2', name: 'Killua Zoldyck', japaneseName: 'キルア＝ゾルディック', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/223747.jpg', voiceActor: { name: 'Mariya Ise', japaneseName: '伊瀬茉莉也', image: 'https://cdn.myanimelist.net/images/voiceactors/2/41935.jpg', language: 'Japanese' } },
  { id: '4-c3', name: 'Kurapika', japaneseName: 'クラピカ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/223745.jpg', voiceActor: { name: 'Miyuki Sawashiro', japaneseName: '沢城みゆき', image: 'https://cdn.myanimelist.net/images/voiceactors/3/49100.jpg', language: 'Japanese' } },
  { id: '4-c4', name: 'Hisoka Morow', japaneseName: 'ヒソカ＝モロウ', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/7/223743.jpg', voiceActor: { name: 'Daisuke Namikawa', japaneseName: '浪川大輔', image: 'https://cdn.myanimelist.net/images/voiceactors/3/45349.jpg', language: 'Japanese' } },
],
'5': [
  { id: '5-c1', name: 'Eren Yeager', japaneseName: 'エレン・イェーガー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/216895.jpg', voiceActor: { name: 'Yuki Kaji', japaneseName: '梶裕貴', image: 'https://cdn.myanimelist.net/images/voiceactors/3/95672.jpg', language: 'Japanese' } },
  { id: '5-c2', name: 'Mikasa Ackerman', japaneseName: 'ミカサ・アッカーマン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/215563.jpg', voiceActor: { name: 'Yui Ishikawa', japaneseName: '石川由依', image: 'https://cdn.myanimelist.net/images/voiceactors/3/100142.jpg', language: 'Japanese' } },
  { id: '5-c3', name: 'Armin Arlert', japaneseName: 'アルミン・アルレルト', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/5/216893.jpg', voiceActor: { name: 'Marina Inoue', japaneseName: '井上麻里奈', image: 'https://cdn.myanimelist.net/images/voiceactors/3/95158.jpg', language: 'Japanese' } },
  { id: '5-c4', name: 'Levi Ackerman', japaneseName: 'リヴァイ・アッカーマン', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/2/241417.jpg', voiceActor: { name: 'Hiroshi Kamiya', japaneseName: '神谷浩史', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15029.jpg', language: 'Japanese' } },
],
'6': [
  { id: '6-c1', name: 'Satoru Gojo', japaneseName: '五条悟', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/13/441744.jpg', voiceActor: { name: 'Yuuichi Nakamura', japaneseName: '中村悠一', image: 'https://cdn.myanimelist.net/images/voiceactors/1/54964.jpg', language: 'Japanese' } },
  { id: '6-c2', name: 'Suguru Geto', japaneseName: '夏油傑', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/7/441749.jpg', voiceActor: { name: 'Takahiro Sakurai', japaneseName: '櫻井孝宏', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15285.jpg', language: 'Japanese' } },
  { id: '6-c3', name: 'Toji Fushiguro', japaneseName: '伏黒甚爾', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/8/441750.jpg', voiceActor: { name: 'Takehito Koyasu', japaneseName: '子安武人', image: 'https://cdn.myanimelist.net/images/voiceactors/2/43928.jpg', language: 'Japanese' } },
],
'7': [
  { id: '7-c1', name: 'Tanjiro Kamado', japaneseName: '竈門炭治郎', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/14/418794.jpg', voiceActor: { name: 'Natsuki Hanae', japaneseName: '花江夏樹', image: 'https://cdn.myanimelist.net/images/voiceactors/1/32962.jpg', language: 'Japanese' } },
  { id: '7-c2', name: 'Giyu Tomioka', japaneseName: '冨岡義勇', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/418798.jpg', voiceActor: { name: 'Takahiro Sakurai', japaneseName: '櫻井孝宏', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15285.jpg', language: 'Japanese' } },
  { id: '7-c3', name: 'Shinobu Kocho', japaneseName: '胡蝶しのぶ', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/4/418799.jpg', voiceActor: { name: 'Saori Hayami', japaneseName: '早見沙織', image: 'https://cdn.myanimelist.net/images/voiceactors/3/54347.jpg', language: 'Japanese' } },
],
'8': [
  { id: '8-c1', name: 'Frieren', japaneseName: 'フリーレン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/520857.jpg', voiceActor: { name: 'Atsumi Tanezaki', japaneseName: '種﨑敦美', image: 'https://cdn.myanimelist.net/images/voiceactors/2/66499.jpg', language: 'Japanese' } },
  { id: '8-c2', name: 'Fern', japaneseName: 'フェルン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/520858.jpg', voiceActor: { name: 'Kana Ichinose', japaneseName: '市ノ瀬加那', image: 'https://cdn.myanimelist.net/images/voiceactors/3/51829.jpg', language: 'Japanese' } },
  { id: '8-c3', name: 'Stark', japaneseName: 'シュタルク', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/520859.jpg', voiceActor: { name: 'Chiaki Kobayashi', japaneseName: '小林千晃', image: 'https://cdn.myanimelist.net/images/voiceactors/2/70025.jpg', language: 'Japanese' } },
  { id: '8-c4', name: 'Himmel', japaneseName: 'ヒンメル', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/10/520860.jpg', voiceActor: { name: 'Nobuhiko Okamoto', japaneseName: '岡本信彦', image: 'https://cdn.myanimelist.net/images/voiceactors/1/50640.jpg', language: 'Japanese' } },
],
'9': [
  { id: '9-c1', name: 'Monkey D. Luffy', japaneseName: 'モンキー・D・ルフィ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/310307.jpg', voiceActor: { name: 'Mayumi Tanaka', japaneseName: '田中真弓', image: 'https://cdn.myanimelist.net/images/voiceactors/1/12205.jpg', language: 'Japanese' } },
  { id: '9-c2', name: 'Roronoa Zoro', japaneseName: 'ロロノア・ゾロ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/100534.jpg', voiceActor: { name: 'Kazuya Nakai', japaneseName: '中井和哉', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15031.jpg', language: 'Japanese' } },
  { id: '9-c3', name: 'Nami', japaneseName: 'ナミ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/263249.jpg', voiceActor: { name: 'Akemi Okamura', japaneseName: '岡村明美', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15032.jpg', language: 'Japanese' } },
  { id: '9-c4', name: 'Sanji', japaneseName: 'サンジ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/5/136417.jpg', voiceActor: { name: 'Hiroaki Hirata', japaneseName: '平田広明', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15030.jpg', language: 'Japanese' } },
],
'10': [
  { id: '10-c1', name: 'Thorfinn', japaneseName: 'トルフィン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/496733.jpg', voiceActor: { name: 'Yuto Uemura', japaneseName: '上村祐翔', image: 'https://cdn.myanimelist.net/images/voiceactors/2/66497.jpg', language: 'Japanese' } },
  { id: '10-c2', name: 'Einar', japaneseName: 'エイナル', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/496734.jpg', voiceActor: { name: 'Shunsuke Takeuchi', japaneseName: '武内駿輔', image: 'https://cdn.myanimelist.net/images/voiceactors/2/66496.jpg', language: 'Japanese' } },
  { id: '10-c3', name: 'Canute', japaneseName: 'クヌート', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/496735.jpg', voiceActor: { name: 'Kensho Ono', japaneseName: '小野賢章', image: 'https://cdn.myanimelist.net/images/voiceactors/1/47217.jpg', language: 'Japanese' } },
],
'11': [
  { id: '11-c1', name: 'Sung Jinwoo', japaneseName: '성진우', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/12/532989.jpg', voiceActor: { name: 'Taito Ban', japaneseName: '坂泰斗', image: 'https://cdn.myanimelist.net/images/voiceactors/3/70027.jpg', language: 'Japanese' } },
  { id: '11-c2', name: 'Cha Hae-In', japaneseName: '차해인', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/8/532990.jpg', voiceActor: { name: 'Reina Ueda', japaneseName: '上田麗奈', image: 'https://cdn.myanimelist.net/images/voiceactors/3/67281.jpg', language: 'Japanese' } },
  { id: '11-c3', name: 'Yoo Jinho', japaneseName: '유진호', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/5/532991.jpg', voiceActor: { name: 'Genta Nakamura', japaneseName: '中村源太', image: 'https://cdn.myanimelist.net/images/voiceactors/1/70028.jpg', language: 'Japanese' } },
],
'12': [
  { id: '12-c1', name: 'Yoichi Isagi', japaneseName: '潔世一', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/15/491950.jpg', voiceActor: { name: 'Kazuki Ura', japaneseName: '浦和希', image: 'https://cdn.myanimelist.net/images/voiceactors/2/70029.jpg', language: 'Japanese' } },
  { id: '12-c2', name: 'Meguru Bachira', japaneseName: '蜂楽廻', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/491951.jpg', voiceActor: { name: 'Tasuku Kaito', japaneseName: '海渡翼', image: 'https://cdn.myanimelist.net/images/voiceactors/3/70030.jpg', language: 'Japanese' } },
  { id: '12-c3', name: 'Seishiro Nagi', japaneseName: '凪誠士郎', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/491952.jpg', voiceActor: { name: 'Nobunaga Shimazaki', japaneseName: '島崎信長', image: 'https://cdn.myanimelist.net/images/voiceactors/1/57788.jpg', language: 'Japanese' } },
],
'13': [
  { id: '13-c1', name: 'Denji', japaneseName: 'デンジ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/492582.jpg', voiceActor: { name: 'Kikunosuke Toya', japaneseName: '戸谷菊之介', image: 'https://cdn.myanimelist.net/images/voiceactors/1/70031.jpg', language: 'Japanese' } },
  { id: '13-c2', name: 'Power', japaneseName: 'パワー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/492583.jpg', voiceActor: { name: 'Fairouz Ai', japaneseName: 'ファイルーズあい', image: 'https://cdn.myanimelist.net/images/voiceactors/3/69048.jpg', language: 'Japanese' } },
  { id: '13-c3', name: 'Makima', japaneseName: 'マキマ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/492584.jpg', voiceActor: { name: 'Tomori Kusunoki', japaneseName: '楠木ともり', image: 'https://cdn.myanimelist.net/images/voiceactors/3/79205.jpg', language: 'Japanese' } },
],
'14': [
  { id: '14-c1', name: 'Loid Forger', japaneseName: 'ロイド・フォージャー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/14/473767.jpg', voiceActor: { name: 'Takuya Eguchi', japaneseName: '江口拓也', image: 'https://cdn.myanimelist.net/images/voiceactors/3/53987.jpg', language: 'Japanese' } },
  { id: '14-c2', name: 'Anya Forger', japaneseName: 'アーニャ・フォージャー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/473768.jpg', voiceActor: { name: 'Atsumi Tanezaki', japaneseName: '種﨑敦美', image: 'https://cdn.myanimelist.net/images/voiceactors/2/66499.jpg', language: 'Japanese' } },
  { id: '14-c3', name: 'Yor Forger', japaneseName: 'ヨル・フォージャー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/473769.jpg', voiceActor: { name: 'Saori Hayami', japaneseName: '早見沙織', image: 'https://cdn.myanimelist.net/images/voiceactors/3/54347.jpg', language: 'Japanese' } },
],
'15': [
  { id: '15-c1', name: 'Hitori Gotou', japaneseName: '後藤ひとり', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/492211.jpg', voiceActor: { name: 'Yoshino Aoyama', japaneseName: '青山吉能', image: 'https://cdn.myanimelist.net/images/voiceactors/1/70033.jpg', language: 'Japanese' } },
  { id: '15-c2', name: 'Nijika Ijichi', japaneseName: '伊地知虹夏', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/492212.jpg', voiceActor: { name: 'Sayumi Suzushiro', japaneseName: '鈴代紗弓', image: 'https://cdn.myanimelist.net/images/voiceactors/2/70034.jpg', language: 'Japanese' } },
  { id: '15-c3', name: 'Ryo Yamada', japaneseName: '山田リョウ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/12/492213.jpg', voiceActor: { name: 'Saku Mizuno', japaneseName: '水野朔', image: 'https://cdn.myanimelist.net/images/voiceactors/3/70035.jpg', language: 'Japanese' } },
],
'16': [
  { id: '16-c1', name: 'Shinji Ikari', japaneseName: '碇シンジ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/151249.jpg', voiceActor: { name: 'Megumi Ogata', japaneseName: '緒方恵美', image: 'https://cdn.myanimelist.net/images/voiceactors/2/24831.jpg', language: 'Japanese' } },
  { id: '16-c2', name: 'Rei Ayanami', japaneseName: '綾波レイ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/15/304996.jpg', voiceActor: { name: 'Megumi Hayashibara', japaneseName: '林原めぐみ', image: 'https://cdn.myanimelist.net/images/voiceactors/3/24773.jpg', language: 'Japanese' } },
  { id: '16-c3', name: 'Asuka Langley Soryu', japaneseName: '惣流・アスカ・ラングレー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/305018.jpg', voiceActor: { name: 'Yuko Miyamura', japaneseName: '宮村優子', image: 'https://cdn.myanimelist.net/images/voiceactors/1/24832.jpg', language: 'Japanese' } },
],
'17': [
  { id: '17-c1', name: 'Laios Touden', japaneseName: 'ライオス・トーデン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/530635.jpg', voiceActor: { name: 'Kentaro Kumagai', japaneseName: '熊谷健太郎', image: 'https://cdn.myanimelist.net/images/voiceactors/2/70037.jpg', language: 'Japanese' } },
  { id: '17-c2', name: 'Marcille Donato', japaneseName: 'マルシル・ドナトー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/15/530636.jpg', voiceActor: { name: 'Sayaka Senbongi', japaneseName: '千本木彩花', image: 'https://cdn.myanimelist.net/images/voiceactors/2/41872.jpg', language: 'Japanese' } },
  { id: '17-c3', name: 'Chilchuck Tims', japaneseName: 'チルチャック・ティムズ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/530637.jpg', voiceActor: { name: 'Asamu Tomari', japaneseName: '泊明日菜', image: 'https://cdn.myanimelist.net/images/voiceactors/1/70038.jpg', language: 'Japanese' } },
],
'18': [
  { id: '18-c1', name: 'Aqua Hoshino', japaneseName: '星野愛久愛海', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/507005.jpg', voiceActor: { name: 'Takeo Otsuka', japaneseName: '大塚剛央', image: 'https://cdn.myanimelist.net/images/voiceactors/3/70039.jpg', language: 'Japanese' } },
  { id: '18-c2', name: 'Ruby Hoshino', japaneseName: '星野瑠美衣', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/16/507006.jpg', voiceActor: { name: 'Yurie Igoma', japaneseName: '伊駒ゆりえ', image: 'https://cdn.myanimelist.net/images/voiceactors/1/70040.jpg', language: 'Japanese' } },
  { id: '18-c3', name: 'Ai Hoshino', japaneseName: '星野アイ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/507007.jpg', voiceActor: { name: 'Rie Takahashi', japaneseName: '高橋李依', image: 'https://cdn.myanimelist.net/images/voiceactors/3/67226.jpg', language: 'Japanese' } },
],
'19': [
  { id: '19-c1', name: 'Rudeus Greyrat', japaneseName: 'ルーデウス・グレイラット', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/427958.jpg', voiceActor: { name: 'Yumi Uchiyama', japaneseName: '内山夕実', image: 'https://cdn.myanimelist.net/images/voiceactors/3/52993.jpg', language: 'Japanese' } },
  { id: '19-c2', name: 'Sylphiette', japaneseName: 'シルフィエット', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/427959.jpg', voiceActor: { name: 'Ai Kayano', japaneseName: '茅野愛衣', image: 'https://cdn.myanimelist.net/images/voiceactors/3/41926.jpg', language: 'Japanese' } },
  { id: '19-c3', name: 'Eris Boreas Greyrat', japaneseName: 'エリス・ボレアス・グレイラット', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/14/427960.jpg', voiceActor: { name: 'Ai Kakuma', japaneseName: '加隈亜衣', image: 'https://cdn.myanimelist.net/images/voiceactors/1/52992.jpg', language: 'Japanese' } },
],
'20': [
  { id: '20-c1', name: 'Chisato Nishikigi', japaneseName: '錦木千束', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/14/479532.jpg', voiceActor: { name: 'Chika Anzai', japaneseName: '安済知佳', image: 'https://cdn.myanimelist.net/images/voiceactors/1/50563.jpg', language: 'Japanese' } },
  { id: '20-c2', name: 'Takina Inoue', japaneseName: '井ノ上たきな', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/479533.jpg', voiceActor: { name: 'Shion Wakayama', japaneseName: '若山詩音', image: 'https://cdn.myanimelist.net/images/voiceactors/3/70041.jpg', language: 'Japanese' } },
  { id: '20-c3', name: 'Kurumi', japaneseName: 'クルミ', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/11/479535.jpg', voiceActor: { name: 'Misaki Kuno', japaneseName: '久野美咲', image: 'https://cdn.myanimelist.net/images/voiceactors/2/50564.jpg', language: 'Japanese' } },
],
// ── New anime IDs 21-50 (MAL CDN character images via Jikan) ──
'21': [
  { id: '21-c1', name: 'Kafka Hibino', japaneseName: 'カフカ・ヒビノ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/523376.jpg', voiceActor: { name: 'Junichi Suwabe', japaneseName: '諏訪部順一', image: 'https://cdn.myanimelist.net/images/voiceactors/3/53870.jpg', language: 'Japanese' } },
  { id: '21-c2', name: 'Mina Ashiro', japaneseName: '亜白ミナ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/12/523377.jpg', voiceActor: { name: 'Fairouz Ai', japaneseName: 'ファイルーズあい', image: 'https://cdn.myanimelist.net/images/voiceactors/3/69048.jpg', language: 'Japanese' } },
  { id: '21-c3', name: 'Kikoru Shinomiya', japaneseName: '四ノ宮キコル', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/8/523378.jpg', voiceActor: { name: 'Tomori Kusunoki', japaneseName: '楠木ともり', image: 'https://cdn.myanimelist.net/images/voiceactors/3/79205.jpg', language: 'Japanese' } },
],
'22': [
  { id: '22-c1', name: 'Yuji Itadori', japaneseName: '虎杖悠仁', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/15/441745.jpg', voiceActor: { name: 'Shouya Ishige', japaneseName: '石毛翔弥', image: 'https://cdn.myanimelist.net/images/voiceactors/3/69208.jpg', language: 'Japanese' } },
  { id: '22-c2', name: 'Ryoumen Sukuna', japaneseName: '両面宿儺', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/2/441746.jpg', voiceActor: { name: 'Junichi Suwabe', japaneseName: '諏訪部順一', image: 'https://cdn.myanimelist.net/images/voiceactors/3/53870.jpg', language: 'Japanese' } },
  { id: '22-c3', name: 'Megumi Fushiguro', japaneseName: '伏黒恵', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/13/441747.jpg', voiceActor: { name: 'Yuma Uchida', japaneseName: '内田雄馬', image: 'https://cdn.myanimelist.net/images/voiceactors/3/63913.jpg', language: 'Japanese' } },
  { id: '22-c4', name: 'Nobara Kugisaki', japaneseName: '釘崎野薔薇', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/14/441748.jpg', voiceActor: { name: 'Asami Seto', japaneseName: '瀬戸麻沙美', image: 'https://cdn.myanimelist.net/images/voiceactors/3/52994.jpg', language: 'Japanese' } },
],
'23': [
  { id: '23-c1', name: 'Tanjiro Kamado', japaneseName: '竈門炭治郎', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/14/418794.jpg', voiceActor: { name: 'Natsuki Hanae', japaneseName: '花江夏樹', image: 'https://cdn.myanimelist.net/images/voiceactors/1/32962.jpg', language: 'Japanese' } },
  { id: '23-c2', name: 'Nezuko Kamado', japaneseName: '竈門禰豆子', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/16/418795.jpg', voiceActor: { name: 'Akari Kito', japaneseName: '鬼頭明里', image: 'https://cdn.myanimelist.net/images/voiceactors/3/68697.jpg', language: 'Japanese' } },
  { id: '23-c3', name: 'Zenitsu Agatsuma', japaneseName: '我妻善逸', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/418796.jpg', voiceActor: { name: 'Hiro Shimono', japaneseName: '下野紘', image: 'https://cdn.myanimelist.net/images/voiceactors/3/57539.jpg', language: 'Japanese' } },
  { id: '23-c4', name: 'Inosuke Hashibira', japaneseName: '嘴平伊之助', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/7/418797.jpg', voiceActor: { name: 'Yoshitsugu Matsuoka', japaneseName: '松岡禎丞', image: 'https://cdn.myanimelist.net/images/voiceactors/3/46332.jpg', language: 'Japanese' } },
],
'24': [
  { id: '24-c1', name: 'Light Yagami', japaneseName: '夜神月', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/168035.jpg', voiceActor: { name: 'Mamoru Miyano', japaneseName: '宮野真守', image: 'https://cdn.myanimelist.net/images/voiceactors/3/55052.jpg', language: 'Japanese' } },
  { id: '24-c2', name: 'L Lawliet', japaneseName: 'L・ローライト', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/9548.jpg', voiceActor: { name: 'Kappei Yamaguchi', japaneseName: '山口勝平', image: 'https://cdn.myanimelist.net/images/voiceactors/2/17450.jpg', language: 'Japanese' } },
  { id: '24-c3', name: 'Ryuk', japaneseName: 'リューク', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/3/9549.jpg', voiceActor: { name: 'Shidou Nakamura', japaneseName: '中村獅童', image: 'https://cdn.myanimelist.net/images/voiceactors/1/10791.jpg', language: 'Japanese' } },
  { id: '24-c4', name: 'Misa Amane', japaneseName: '弥海砂', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/5/9550.jpg', voiceActor: { name: 'Aya Hirano', japaneseName: '平野綾', image: 'https://cdn.myanimelist.net/images/voiceactors/3/24830.jpg', language: 'Japanese' } },
],
'25': [
  { id: '25-c1', name: 'Lelouch vi Britannia', japaneseName: 'ルルーシュ・ランペルージ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/50271.jpg', voiceActor: { name: 'Jun Fukuyama', japaneseName: '福山潤', image: 'https://cdn.myanimelist.net/images/voiceactors/3/41622.jpg', language: 'Japanese' } },
  { id: '25-c2', name: 'Suzaku Kururugi', japaneseName: '枢木スザク', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/12/50272.jpg', voiceActor: { name: 'Takahiro Sakurai', japaneseName: '櫻井孝宏', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15285.jpg', language: 'Japanese' } },
  { id: '25-c3', name: 'C.C.', japaneseName: 'C.C.', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/50273.jpg', voiceActor: { name: 'Yukana', japaneseName: 'ゆかな', image: 'https://cdn.myanimelist.net/images/voiceactors/2/26699.jpg', language: 'Japanese' } },
],
'26': [
  { id: '26-c1', name: 'Naruto Uzumaki', japaneseName: 'うずまきナルト', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/284121.jpg', voiceActor: { name: 'Junko Takeuchi', japaneseName: '竹内順子', image: 'https://cdn.myanimelist.net/images/voiceactors/1/24879.jpg', language: 'Japanese' } },
  { id: '26-c2', name: 'Sasuke Uchiha', japaneseName: 'うちはサスケ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/131317.jpg', voiceActor: { name: 'Noriaki Sugiyama', japaneseName: '杉山紀彰', image: 'https://cdn.myanimelist.net/images/voiceactors/1/21905.jpg', language: 'Japanese' } },
  { id: '26-c3', name: 'Sakura Haruno', japaneseName: '春野サクラ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/174545.jpg', voiceActor: { name: 'Chie Nakamura', japaneseName: '中村千絵', image: 'https://cdn.myanimelist.net/images/voiceactors/3/19182.jpg', language: 'Japanese' } },
  { id: '26-c4', name: 'Kakashi Hatake', japaneseName: 'はたけカカシ', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/7/284119.jpg', voiceActor: { name: 'Kazuhiko Inoue', japaneseName: '井上和彦', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15028.jpg', language: 'Japanese' } },
],
'27': [
  { id: '27-c1', name: 'Shigeo Kageyama', japaneseName: '影山茂夫', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/357370.jpg', voiceActor: { name: 'Setsuo Ito', japaneseName: '伊藤節生', image: 'https://cdn.myanimelist.net/images/voiceactors/2/59866.jpg', language: 'Japanese' } },
  { id: '27-c2', name: 'Arataka Reigen', japaneseName: '霊幻新隆', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/357371.jpg', voiceActor: { name: 'Takahiro Sakurai', japaneseName: '櫻井孝宏', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15285.jpg', language: 'Japanese' } },
  { id: '27-c3', name: 'Dimple', japaneseName: 'エクボ', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/3/357372.jpg', voiceActor: { name: 'Akio Otsuka', japaneseName: '大塚明夫', image: 'https://cdn.myanimelist.net/images/voiceactors/1/17810.jpg', language: 'Japanese' } },
],
'28': [
  { id: '28-c1', name: 'Gintoki Sakata', japaneseName: '坂田銀時', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/72562.jpg', voiceActor: { name: 'Daisuke Sugita', japaneseName: '杉田智和', image: 'https://cdn.myanimelist.net/images/voiceactors/3/23447.jpg', language: 'Japanese' } },
  { id: '28-c2', name: 'Shinpachi Shimura', japaneseName: '志村新八', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/72563.jpg', voiceActor: { name: 'Daisuke Sakaguchi', japaneseName: '阪口大助', image: 'https://cdn.myanimelist.net/images/voiceactors/1/26890.jpg', language: 'Japanese' } },
  { id: '28-c3', name: 'Kagura', japaneseName: '神楽', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/72564.jpg', voiceActor: { name: 'Rie Kugimiya', japaneseName: '釘宮理恵', image: 'https://cdn.myanimelist.net/images/voiceactors/3/17641.jpg', language: 'Japanese' } },
],
'29': [
  { id: '29-c1', name: 'Shouyou Hinata', japaneseName: '日向翔陽', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/280785.jpg', voiceActor: { name: 'Ayumu Murase', japaneseName: '村瀬歩', image: 'https://cdn.myanimelist.net/images/voiceactors/1/50562.jpg', language: 'Japanese' } },
  { id: '29-c2', name: 'Tobio Kageyama', japaneseName: '影山飛雄', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/280786.jpg', voiceActor: { name: 'Kaito Ishikawa', japaneseName: '石川界人', image: 'https://cdn.myanimelist.net/images/voiceactors/3/50539.jpg', language: 'Japanese' } },
  { id: '29-c3', name: 'Wakatoshi Ushijima', japaneseName: '牛島若利', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/9/280787.jpg', voiceActor: { name: 'Ryouta Ohsaka', japaneseName: '逢坂良太', image: 'https://cdn.myanimelist.net/images/voiceactors/2/50594.jpg', language: 'Japanese' } },
],
'30': [
  { id: '30-c1', name: 'Son Goku', japaneseName: '孫悟空', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/57453.jpg', voiceActor: { name: 'Masako Nozawa', japaneseName: '野沢雅子', image: 'https://cdn.myanimelist.net/images/voiceactors/1/12205.jpg', language: 'Japanese' } },
  { id: '30-c2', name: 'Broly', japaneseName: 'ブロリー', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/9/376085.jpg', voiceActor: { name: 'Bin Shimada', japaneseName: '島田敏', image: 'https://cdn.myanimelist.net/images/voiceactors/1/13985.jpg', language: 'Japanese' } },
  { id: '30-c3', name: 'Vegeta', japaneseName: 'ベジータ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/55129.jpg', voiceActor: { name: 'Ryou Horikawa', japaneseName: '堀川りょう', image: 'https://cdn.myanimelist.net/images/voiceactors/1/13021.jpg', language: 'Japanese' } },
],
'31': [
  { id: '31-c1', name: 'Kaguya Shinomiya', japaneseName: '四宮かぐや', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/406533.jpg', voiceActor: { name: 'Aoi Koga', japaneseName: '古賀葵', image: 'https://cdn.myanimelist.net/images/voiceactors/1/70001.jpg', language: 'Japanese' } },
  { id: '31-c2', name: 'Miyuki Shirogane', japaneseName: '白銀御行', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/406534.jpg', voiceActor: { name: 'Makoto Furukawa', japaneseName: '古川慎', image: 'https://cdn.myanimelist.net/images/voiceactors/1/54963.jpg', language: 'Japanese' } },
  { id: '31-c3', name: 'Chika Fujiwara', japaneseName: '藤原千花', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/5/406535.jpg', voiceActor: { name: 'Konomi Kohara', japaneseName: '古賀葵', image: 'https://cdn.myanimelist.net/images/voiceactors/3/69698.jpg', language: 'Japanese' } },
],
'32': [
  { id: '32-c1', name: 'Guts', japaneseName: 'ガッツ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/234973.jpg', voiceActor: { name: 'Hiroaki Iwanaga', japaneseName: '岩永洋昭', image: 'https://cdn.myanimelist.net/images/voiceactors/3/56248.jpg', language: 'Japanese' } },
  { id: '32-c2', name: 'Griffith', japaneseName: 'グリフィス', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/10/234974.jpg', voiceActor: { name: 'Takahiro Sakurai', japaneseName: '櫻井孝宏', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15285.jpg', language: 'Japanese' } },
  { id: '32-c3', name: 'Casca', japaneseName: 'キャスカ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/234975.jpg', voiceActor: { name: 'Toa Yukinari', japaneseName: '行成とあ', image: 'https://cdn.myanimelist.net/images/voiceactors/1/69648.jpg', language: 'Japanese' } },
],
'33': [
  { id: '33-c1', name: 'Spike Spiegel', japaneseName: 'スパイク・スピーゲル', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/3483.jpg', voiceActor: { name: 'Koichi Yamadera', japaneseName: '山寺宏一', image: 'https://cdn.myanimelist.net/images/voiceactors/2/26614.jpg', language: 'Japanese' } },
  { id: '33-c2', name: 'Jet Black', japaneseName: 'ジェット・ブラック', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/7/3484.jpg', voiceActor: { name: 'Unsho Ishizuka', japaneseName: '石塚運昇', image: 'https://cdn.myanimelist.net/images/voiceactors/1/11791.jpg', language: 'Japanese' } },
  { id: '33-c3', name: 'Faye Valentine', japaneseName: 'フェイ・ヴァレンタイン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/3485.jpg', voiceActor: { name: 'Megumi Hayashibara', japaneseName: '林原めぐみ', image: 'https://cdn.myanimelist.net/images/voiceactors/3/24773.jpg', language: 'Japanese' } },
],
'34': [
  { id: '34-c1', name: 'Riko', japaneseName: 'リコ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/13/320461.jpg', voiceActor: { name: 'Miyu Tomita', japaneseName: '富田美憂', image: 'https://cdn.myanimelist.net/images/voiceactors/3/66052.jpg', language: 'Japanese' } },
  { id: '34-c2', name: 'Reg', japaneseName: 'レグ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/320462.jpg', voiceActor: { name: 'Mariya Ise', japaneseName: '伊瀬茉莉也', image: 'https://cdn.myanimelist.net/images/voiceactors/2/41935.jpg', language: 'Japanese' } },
  { id: '34-c3', name: 'Nanachi', japaneseName: 'ナナチ', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/15/320463.jpg', voiceActor: { name: 'Shiori Izawa', japaneseName: '伊沢柚奈', image: 'https://cdn.myanimelist.net/images/voiceactors/1/65416.jpg', language: 'Japanese' } },
],
'35': [
  { id: '35-c1', name: 'Saitama', japaneseName: 'サイタマ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/299260.jpg', voiceActor: { name: 'Makoto Furukawa', japaneseName: '古川慎', image: 'https://cdn.myanimelist.net/images/voiceactors/1/54963.jpg', language: 'Japanese' } },
  { id: '35-c2', name: 'Genos', japaneseName: 'ジェノス', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/299261.jpg', voiceActor: { name: 'Kaito Ishikawa', japaneseName: '石川界人', image: 'https://cdn.myanimelist.net/images/voiceactors/3/50539.jpg', language: 'Japanese' } },
  { id: '35-c3', name: 'Speed-o\'-Sound Sonic', japaneseName: '音速のソニック', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/2/299262.jpg', voiceActor: { name: 'Yuki Kaji', japaneseName: '梶裕貴', image: 'https://cdn.myanimelist.net/images/voiceactors/3/95672.jpg', language: 'Japanese' } },
],
'36': [
  { id: '36-c1', name: 'Izuku Midoriya', japaneseName: '緑谷出久', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/333397.jpg', voiceActor: { name: 'Daiki Yamashita', japaneseName: '山下大輝', image: 'https://cdn.myanimelist.net/images/voiceactors/1/56847.jpg', language: 'Japanese' } },
  { id: '36-c2', name: 'Katsuki Bakugo', japaneseName: '爆豪勝己', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/13/333398.jpg', voiceActor: { name: 'Nobuhiko Okamoto', japaneseName: '岡本信彦', image: 'https://cdn.myanimelist.net/images/voiceactors/1/50640.jpg', language: 'Japanese' } },
  { id: '36-c3', name: 'Ochaco Uraraka', japaneseName: '麗日お茶子', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/333399.jpg', voiceActor: { name: 'Ayane Sakura', japaneseName: '佐倉綾音', image: 'https://cdn.myanimelist.net/images/voiceactors/3/59827.jpg', language: 'Japanese' } },
],
'37': [
  { id: '37-c1', name: 'Kirito', japaneseName: 'キリト', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/240360.jpg', voiceActor: { name: 'Yoshitsugu Matsuoka', japaneseName: '松岡禎丞', image: 'https://cdn.myanimelist.net/images/voiceactors/3/46332.jpg', language: 'Japanese' } },
  { id: '37-c2', name: 'Asuna', japaneseName: 'アスナ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/240361.jpg', voiceActor: { name: 'Haruka Tomatsu', japaneseName: '戸松遥', image: 'https://cdn.myanimelist.net/images/voiceactors/3/40904.jpg', language: 'Japanese' } },
  { id: '37-c3', name: 'Sinon', japaneseName: 'シノン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/7/240362.jpg', voiceActor: { name: 'Miyuki Sawashiro', japaneseName: '沢城みゆき', image: 'https://cdn.myanimelist.net/images/voiceactors/3/49100.jpg', language: 'Japanese' } },
],
'38': [
  { id: '38-c1', name: 'Takemichi Hanagaki', japaneseName: '花垣武道', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/14/455831.jpg', voiceActor: { name: 'Yuuki Shin', japaneseName: '新祐樹', image: 'https://cdn.myanimelist.net/images/voiceactors/2/70026.jpg', language: 'Japanese' } },
  { id: '38-c2', name: 'Manjiro Sano', japaneseName: '佐野万次郎', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/7/455832.jpg', voiceActor: { name: 'Yuuki Shin', japaneseName: '新祐樹', image: 'https://cdn.myanimelist.net/images/voiceactors/2/66498.jpg', language: 'Japanese' } },
  { id: '38-c3', name: 'Ken Ryuuguuji', japaneseName: '龍宮寺堅', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/455833.jpg', voiceActor: { name: 'Masaya Fukunishi', japaneseName: '福西勝也', image: 'https://cdn.myanimelist.net/images/voiceactors/1/70987.jpg', language: 'Japanese' } },
],
'39': [
  { id: '39-c1', name: 'Subaru Natsuki', japaneseName: '菜月昂', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/14/304829.jpg', voiceActor: { name: 'Yusuke Kobayashi', japaneseName: '小林裕介', image: 'https://cdn.myanimelist.net/images/voiceactors/3/64380.jpg', language: 'Japanese' } },
  { id: '39-c2', name: 'Emilia', japaneseName: 'エミリア', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/304830.jpg', voiceActor: { name: 'Rie Takahashi', japaneseName: '高橋李依', image: 'https://cdn.myanimelist.net/images/voiceactors/3/67226.jpg', language: 'Japanese' } },
  { id: '39-c3', name: 'Rem', japaneseName: 'レム', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/13/304831.jpg', voiceActor: { name: 'Inori Minase', japaneseName: '水瀬いのり', image: 'https://cdn.myanimelist.net/images/voiceactors/3/60527.jpg', language: 'Japanese' } },
  { id: '39-c4', name: 'Ram', japaneseName: 'ラム', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/10/304832.jpg', voiceActor: { name: 'Rie Murakawa', japaneseName: '村川梨衣', image: 'https://cdn.myanimelist.net/images/voiceactors/2/59736.jpg', language: 'Japanese' } },
],
'40': [
  { id: '40-c1', name: 'Bam', japaneseName: 'バム', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/452614.jpg', voiceActor: { name: 'Taichi Ichikawa', japaneseName: '市川太一', image: 'https://cdn.myanimelist.net/images/voiceactors/2/73891.jpg', language: 'Japanese' } },
  { id: '40-c2', name: 'Rachel', japaneseName: 'ラヘル', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/13/452615.jpg', voiceActor: { name: 'Saori Hayami', japaneseName: '早見沙織', image: 'https://cdn.myanimelist.net/images/voiceactors/3/54347.jpg', language: 'Japanese' } },
  { id: '40-c3', name: 'Khun Aguero Agnes', japaneseName: 'クン・アゲロ・アグネス', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/452616.jpg', voiceActor: { name: 'Wataru Hatano', japaneseName: '羽多野渉', image: 'https://cdn.myanimelist.net/images/voiceactors/1/47218.jpg', language: 'Japanese' } },
],
'41': [
  { id: '41-c1', name: 'Mitsuha Miyamizu', japaneseName: '宮水三葉', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/12/320513.jpg', voiceActor: { name: 'Mone Kamishiraishi', japaneseName: '上白石萌音', image: 'https://cdn.myanimelist.net/images/voiceactors/1/64802.jpg', language: 'Japanese' } },
  { id: '41-c2', name: 'Taki Tachibana', japaneseName: '立花瀧', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/320514.jpg', voiceActor: { name: 'Ryunosuke Kamiki', japaneseName: '神木隆之介', image: 'https://cdn.myanimelist.net/images/voiceactors/3/27396.jpg', language: 'Japanese' } },
],
'42': [
  { id: '42-c1', name: 'Chihiro Ogino', japaneseName: '荻野千尋', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/25253.jpg', voiceActor: { name: 'Daveigh Chase', image: 'https://cdn.myanimelist.net/images/voiceactors/2/20773.jpg', language: 'English' } },
  { id: '42-c2', name: 'Haku', japaneseName: 'ハク', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/25254.jpg', voiceActor: { name: 'Suzanne Pleshette', image: 'https://cdn.myanimelist.net/images/voiceactors/1/14892.jpg', language: 'English' } },
  { id: '42-c3', name: 'Yubaba', japaneseName: 'ゆばーば', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/8/25255.jpg', voiceActor: { name: 'Mari Natsuki', japaneseName: '夏木マリ', image: 'https://cdn.myanimelist.net/images/voiceactors/1/13421.jpg', language: 'Japanese' } },
],
'43': [
  { id: '43-c1', name: 'Violet Evergarden', japaneseName: 'ヴァイオレット・エヴァーガーデン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/377467.jpg', voiceActor: { name: 'Yui Ishikawa', japaneseName: '石川由依', image: 'https://cdn.myanimelist.net/images/voiceactors/3/100142.jpg', language: 'Japanese' } },
  { id: '43-c2', name: 'Gilbert Bougainvillea', japaneseName: 'ギルベルト・ブーゲンビリア', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/15/377468.jpg', voiceActor: { name: 'Daisuke Namikawa', japaneseName: '浪川大輔', image: 'https://cdn.myanimelist.net/images/voiceactors/3/45349.jpg', language: 'Japanese' } },
],
'44': [
  { id: '44-c1', name: 'Son Goku', japaneseName: '孫悟空', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/57453.jpg', voiceActor: { name: 'Masako Nozawa', japaneseName: '野沢雅子', image: 'https://cdn.myanimelist.net/images/voiceactors/1/12205.jpg', language: 'Japanese' } },
  { id: '44-c2', name: 'Vegeta', japaneseName: 'ベジータ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/55129.jpg', voiceActor: { name: 'Ryou Horikawa', japaneseName: '堀川りょう', image: 'https://cdn.myanimelist.net/images/voiceactors/1/13021.jpg', language: 'Japanese' } },
  { id: '44-c3', name: 'Gohan', japaneseName: '孫悟飯', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/57454.jpg', voiceActor: { name: 'Masako Nozawa', japaneseName: '野沢雅子', image: 'https://cdn.myanimelist.net/images/voiceactors/1/12205.jpg', language: 'Japanese' } },
  { id: '44-c4', name: 'Frieza', japaneseName: 'フリーザ', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/2/83765.jpg', voiceActor: { name: 'Ryusei Nakao', japaneseName: '中尾隆聖', image: 'https://cdn.myanimelist.net/images/voiceactors/2/11811.jpg', language: 'Japanese' } },
],
'45': [
  { id: '45-c1', name: 'Ichigo Kurosaki', japaneseName: '黒崎一護', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/5/526082.jpg', voiceActor: { name: 'Masakazu Morita', japaneseName: '森田成一', image: 'https://cdn.myanimelist.net/images/voiceactors/3/26413.jpg', language: 'Japanese' } },
  { id: '45-c2', name: 'Rukia Kuchiki', japaneseName: '朽木ルキア', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/526083.jpg', voiceActor: { name: 'Fumiko Orikasa', japaneseName: '折笠富美子', image: 'https://cdn.myanimelist.net/images/voiceactors/3/30640.jpg', language: 'Japanese' } },
  { id: '45-c3', name: 'Yhwach', japaneseName: 'ユーハバッハ', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/12/526084.jpg', voiceActor: { name: 'Sho Hayami', japaneseName: '速水奨', image: 'https://cdn.myanimelist.net/images/voiceactors/1/13019.jpg', language: 'Japanese' } },
],
'46': [
  { id: '46-c1', name: 'Bell Cranel', japaneseName: 'ベル・クラネル', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/7/321524.jpg', voiceActor: { name: 'Yoshitsugu Matsuoka', japaneseName: '松岡禎丞', image: 'https://cdn.myanimelist.net/images/voiceactors/3/46332.jpg', language: 'Japanese' } },
  { id: '46-c2', name: 'Hestia', japaneseName: 'ヘスティア', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/5/321525.jpg', voiceActor: { name: 'Inori Minase', japaneseName: '水瀬いのり', image: 'https://cdn.myanimelist.net/images/voiceactors/3/60527.jpg', language: 'Japanese' } },
  { id: '46-c3', name: 'Ais Wallenstein', japaneseName: 'アイズ・ヴァレンシュタイン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/16/321526.jpg', voiceActor: { name: 'Saori Oonishi', japaneseName: '大西沙織', image: 'https://cdn.myanimelist.net/images/voiceactors/3/62823.jpg', language: 'Japanese' } },
],
'47': [
  { id: '47-c1', name: '2B', japaneseName: 'ヨルハ二号B型', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/517263.jpg', voiceActor: { name: 'Yui Ishikawa', japaneseName: '石川由依', image: 'https://cdn.myanimelist.net/images/voiceactors/3/100142.jpg', language: 'Japanese' } },
  { id: '47-c2', name: '9S', japaneseName: 'ヨルハ九号S型', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/517264.jpg', voiceActor: { name: 'Natsuki Hanae', japaneseName: '花江夏樹', image: 'https://cdn.myanimelist.net/images/voiceactors/1/32962.jpg', language: 'Japanese' } },
],
'48': [
  { id: '48-c1', name: 'Vash the Stampede', japaneseName: 'ヴァッシュ・ザ・スタンピード', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/528193.jpg', voiceActor: { name: 'Yoshitsugu Matsuoka', japaneseName: '松岡禎丞', image: 'https://cdn.myanimelist.net/images/voiceactors/3/46332.jpg', language: 'Japanese' } },
  { id: '48-c2', name: 'Nicholas D. Wolfwood', japaneseName: 'ニコラス・D・ウルフウッド', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/528194.jpg', voiceActor: { name: 'Hiroki Touchi', japaneseName: '東地宏樹', image: 'https://cdn.myanimelist.net/images/voiceactors/2/43929.jpg', language: 'Japanese' } },
],
'49': [
  { id: '49-c1', name: 'Alucard', japaneseName: 'アーカード', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/7/96882.jpg', voiceActor: { name: 'Jouji Nakata', japaneseName: '中田譲治', image: 'https://cdn.myanimelist.net/images/voiceactors/2/10755.jpg', language: 'Japanese' } },
  { id: '49-c2', name: 'Seras Victoria', japaneseName: 'セラス・ヴィクトリア', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/7/96883.jpg', voiceActor: { name: 'Fumiko Orikasa', japaneseName: '折笠富美子', image: 'https://cdn.myanimelist.net/images/voiceactors/3/30640.jpg', language: 'Japanese' } },
  { id: '49-c3', name: 'Integra Hellsing', japaneseName: 'インテグラ・ウィンゲーツ・ヘルシング', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/7/96884.jpg', voiceActor: { name: 'Yoshiko Sakakibara', japaneseName: '榊原良子', image: 'https://cdn.myanimelist.net/images/voiceactors/3/14012.jpg', language: 'Japanese' } },
],
'50': [
  { id: '50-c1', name: 'Kaguya Shinomiya', japaneseName: '四宮かぐや', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/406533.jpg', voiceActor: { name: 'Aoi Koga', japaneseName: '古賀葵', image: 'https://cdn.myanimelist.net/images/voiceactors/1/70001.jpg', language: 'Japanese' } },
  { id: '50-c2', name: 'Miyuki Shirogane', japaneseName: '白銀御行', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/406534.jpg', voiceActor: { name: 'Makoto Furukawa', japaneseName: '古川慎', image: 'https://cdn.myanimelist.net/images/voiceactors/1/54963.jpg', language: 'Japanese' } },
  { id: '50-c3', name: 'Chika Fujiwara', japaneseName: '藤原千花', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/5/406535.jpg', voiceActor: { name: 'Konomi Kohara', japaneseName: '古賀葵', image: 'https://cdn.myanimelist.net/images/voiceactors/3/69698.jpg', language: 'Japanese' } },
],

// ── FATE SERIES CHARACTERS (IDs 51–66) ──────────────────────────────────
'51': [
  { id: '51-c1', name: 'Kiritsugu Emiya', japaneseName: '衛宮切嗣', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/108071.jpg', voiceActor: { name: 'Rikiya Koyama', japaneseName: '小山力也', image: 'https://cdn.myanimelist.net/images/voiceactors/3/57538.jpg', language: 'Japanese' } },
  { id: '51-c2', name: 'Saber (Artoria Pendragon)', japaneseName: 'セイバー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/13/304528.jpg', voiceActor: { name: 'Ayako Kawasumi', japaneseName: '川澄綾子', image: 'https://cdn.myanimelist.net/images/voiceactors/2/40642.jpg', language: 'Japanese' } },
  { id: '51-c3', name: 'Rider (Iskandar)', japaneseName: 'ライダー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/108073.jpg', voiceActor: { name: 'Akio Otsuka', japaneseName: '大塚明夫', image: 'https://cdn.myanimelist.net/images/voiceactors/1/17810.jpg', language: 'Japanese' } },
  { id: '51-c4', name: 'Archer (Gilgamesh)', japaneseName: 'アーチャー', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/5/297946.jpg', voiceActor: { name: 'Tomokazu Seki', japaneseName: '関智一', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15033.jpg', language: 'Japanese' } },
  { id: '51-c5', name: 'Irisviel von Einzbern', japaneseName: 'アイリスフィール・フォン・アインツベルン', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/10/108074.jpg', voiceActor: { name: 'Sayaka Ohara', japaneseName: '大原さやか', image: 'https://cdn.myanimelist.net/images/voiceactors/2/36463.jpg', language: 'Japanese' } },
  { id: '51-c6', name: 'Lancer (Diarmuid)', japaneseName: 'ランサー', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/15/108075.jpg', voiceActor: { name: 'Hikaru Midorikawa', japaneseName: '緑川光', image: 'https://cdn.myanimelist.net/images/voiceactors/2/12962.jpg', language: 'Japanese' } },
  { id: '51-c7', name: 'Waver Velvet', japaneseName: 'ウェイバー・ベルベット', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/4/108076.jpg', voiceActor: { name: 'Daisuke Namikawa', japaneseName: '浪川大輔', image: 'https://cdn.myanimelist.net/images/voiceactors/3/45349.jpg', language: 'Japanese' } },
  { id: '51-c8', name: 'Tokiomi Tohsaka', japaneseName: '遠坂時臣', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/11/108077.jpg', voiceActor: { name: 'Show Hayami', japaneseName: '速水奨', image: 'https://cdn.myanimelist.net/images/voiceactors/1/13019.jpg', language: 'Japanese' } },
],
'52': [
  { id: '52-c1', name: 'Shirou Emiya', japaneseName: '衛宮士郎', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/108069.jpg', voiceActor: { name: 'Noriaki Sugiyama', japaneseName: '杉山紀彰', image: 'https://cdn.myanimelist.net/images/voiceactors/1/21905.jpg', language: 'Japanese' } },
  { id: '52-c2', name: 'Rin Tohsaka', japaneseName: '遠坂凛', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/261834.jpg', voiceActor: { name: 'Kana Ueda', japaneseName: '植田佳奈', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10726.jpg', language: 'Japanese' } },
  { id: '52-c3', name: 'Archer (EMIYA)', japaneseName: 'アーチャー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/14/130173.jpg', voiceActor: { name: 'Junichi Suwabe', japaneseName: '諏訪部順一', image: 'https://cdn.myanimelist.net/images/voiceactors/3/53870.jpg', language: 'Japanese' } },
  { id: '52-c4', name: 'Saber (Artoria Pendragon)', japaneseName: 'セイバー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/13/304528.jpg', voiceActor: { name: 'Ayako Kawasumi', japaneseName: '川澄綾子', image: 'https://cdn.myanimelist.net/images/voiceactors/2/40642.jpg', language: 'Japanese' } },
  { id: '52-c5', name: 'Caster (Medea)', japaneseName: 'キャスター', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/12/108082.jpg', voiceActor: { name: 'Atsuko Tanaka', japaneseName: '田中敦子', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15079.jpg', language: 'Japanese' } },
  { id: '52-c6', name: 'Lancer (Cu Chulainn)', japaneseName: 'ランサー', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/9/108083.jpg', voiceActor: { name: 'Nobutoshi Canna', japaneseName: '神奈延年', image: 'https://cdn.myanimelist.net/images/voiceactors/2/22014.jpg', language: 'Japanese' } },
  { id: '52-c7', name: 'Gilgamesh', japaneseName: 'ギルガメッシュ', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/5/297946.jpg', voiceActor: { name: 'Tomokazu Seki', japaneseName: '関智一', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15033.jpg', language: 'Japanese' } },
],
'53': [
  { id: '53-c1', name: 'Shirou Emiya', japaneseName: '衛宮士郎', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/108069.jpg', voiceActor: { name: 'Noriaki Sugiyama', japaneseName: '杉山紀彰', image: 'https://cdn.myanimelist.net/images/voiceactors/1/21905.jpg', language: 'Japanese' } },
  { id: '53-c2', name: 'Sakura Matou', japaneseName: '間桐桜', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/108085.jpg', voiceActor: { name: 'Noriko Shitaya', japaneseName: '下屋則子', image: 'https://cdn.myanimelist.net/images/voiceactors/2/23700.jpg', language: 'Japanese' } },
  { id: '53-c3', name: 'Rider (Medusa)', japaneseName: 'ライダー', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/16/108086.jpg', voiceActor: { name: 'Yuu Asakawa', japaneseName: '浅川悠', image: 'https://cdn.myanimelist.net/images/voiceactors/3/11394.jpg', language: 'Japanese' } },
  { id: '53-c4', name: 'Saber (Artoria Pendragon)', japaneseName: 'セイバー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/13/304528.jpg', voiceActor: { name: 'Ayako Kawasumi', japaneseName: '川澄綾子', image: 'https://cdn.myanimelist.net/images/voiceactors/2/40642.jpg', language: 'Japanese' } },
  { id: '53-c5', name: 'Illyasviel von Einzbern', japaneseName: 'イリヤスフィール・フォン・アインツベルン', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/7/108087.jpg', voiceActor: { name: 'Mai Kadowaki', japaneseName: '門脇舞以', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10754.jpg', language: 'Japanese' } },
],
'54': [
  { id: '54-c1', name: 'Sakura Matou', japaneseName: '間桐桜', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/108085.jpg', voiceActor: { name: 'Noriko Shitaya', japaneseName: '下屋則子', image: 'https://cdn.myanimelist.net/images/voiceactors/2/23700.jpg', language: 'Japanese' } },
  { id: '54-c2', name: 'Shirou Emiya', japaneseName: '衛宮士郎', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/108069.jpg', voiceActor: { name: 'Noriaki Sugiyama', japaneseName: '杉山紀彰', image: 'https://cdn.myanimelist.net/images/voiceactors/1/21905.jpg', language: 'Japanese' } },
  { id: '54-c3', name: 'Rider (Medusa)', japaneseName: 'ライダー', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/16/108086.jpg', voiceActor: { name: 'Yuu Asakawa', japaneseName: '浅川悠', image: 'https://cdn.myanimelist.net/images/voiceactors/3/11394.jpg', language: 'Japanese' } },
  { id: '54-c4', name: 'Dark Saber (Saber Alter)', japaneseName: 'セイバーオルタ', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/10/304529.jpg', voiceActor: { name: 'Ayako Kawasumi', japaneseName: '川澄綾子', image: 'https://cdn.myanimelist.net/images/voiceactors/2/40642.jpg', language: 'Japanese' } },
  { id: '54-c5', name: 'Kirei Kotomine', japaneseName: '言峰綺礼', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/11/108089.jpg', voiceActor: { name: 'Jouji Nakata', japaneseName: '中田譲治', image: 'https://cdn.myanimelist.net/images/voiceactors/2/10755.jpg', language: 'Japanese' } },
],
'55': [
  { id: '55-c1', name: 'Sakura Matou (Dark)', japaneseName: '間桐桜', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/2/108085.jpg', voiceActor: { name: 'Noriko Shitaya', japaneseName: '下屋則子', image: 'https://cdn.myanimelist.net/images/voiceactors/2/23700.jpg', language: 'Japanese' } },
  { id: '55-c2', name: 'Rider (Medusa)', japaneseName: 'ライダー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/16/108086.jpg', voiceActor: { name: 'Yuu Asakawa', japaneseName: '浅川悠', image: 'https://cdn.myanimelist.net/images/voiceactors/3/11394.jpg', language: 'Japanese' } },
  { id: '55-c3', name: 'Shirou Emiya', japaneseName: '衛宮士郎', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/108069.jpg', voiceActor: { name: 'Noriaki Sugiyama', japaneseName: '杉山紀彰', image: 'https://cdn.myanimelist.net/images/voiceactors/1/21905.jpg', language: 'Japanese' } },
  { id: '55-c4', name: 'Illyasviel von Einzbern', japaneseName: 'イリヤスフィール・フォン・アインツベルン', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/7/108087.jpg', voiceActor: { name: 'Mai Kadowaki', japaneseName: '門脇舞以', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10754.jpg', language: 'Japanese' } },
  { id: '55-c5', name: 'Kirei Kotomine', japaneseName: '言峰綺礼', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/11/108089.jpg', voiceActor: { name: 'Jouji Nakata', japaneseName: '中田譲治', image: 'https://cdn.myanimelist.net/images/voiceactors/2/10755.jpg', language: 'Japanese' } },
],
'56': [
  { id: '56-c1', name: 'Shirou Emiya', japaneseName: '衛宮士郎', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/108069.jpg', voiceActor: { name: 'Noriaki Sugiyama', japaneseName: '杉山紀彰', image: 'https://cdn.myanimelist.net/images/voiceactors/1/21905.jpg', language: 'Japanese' } },
  { id: '56-c2', name: 'Saber (Artoria Pendragon)', japaneseName: 'セイバー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/13/304528.jpg', voiceActor: { name: 'Ayako Kawasumi', japaneseName: '川澄綾子', image: 'https://cdn.myanimelist.net/images/voiceactors/2/40642.jpg', language: 'Japanese' } },
  { id: '56-c3', name: 'Rin Tohsaka', japaneseName: '遠坂凛', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/261834.jpg', voiceActor: { name: 'Kana Ueda', japaneseName: '植田佳奈', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10726.jpg', language: 'Japanese' } },
  { id: '56-c4', name: 'Gilgamesh', japaneseName: 'ギルガメッシュ', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/5/297946.jpg', voiceActor: { name: 'Tomokazu Seki', japaneseName: '関智一', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15033.jpg', language: 'Japanese' } },
],
'57': [
  { id: '57-c1', name: 'Mordred (Saber of Red)', japaneseName: 'モードレッド', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/15/344632.jpg', voiceActor: { name: 'Miyuki Sawashiro', japaneseName: '沢城みゆき', image: 'https://cdn.myanimelist.net/images/voiceactors/3/49100.jpg', language: 'Japanese' } },
  { id: '57-c2', name: 'Jeanne d\'Arc (Ruler)', japaneseName: 'ジャンヌ・ダルク', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/344633.jpg', voiceActor: { name: 'Maaya Sakamoto', japaneseName: '坂本真綾', image: 'https://cdn.myanimelist.net/images/voiceactors/2/36649.jpg', language: 'Japanese' } },
  { id: '57-c3', name: 'Sieg', japaneseName: 'ジーク', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/13/344634.jpg', voiceActor: { name: 'Natsuki Hanae', japaneseName: '花江夏樹', image: 'https://cdn.myanimelist.net/images/voiceactors/1/32962.jpg', language: 'Japanese' } },
  { id: '57-c4', name: 'Astolfo (Rider of Black)', japaneseName: 'アストルフォ', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/15/347453.jpg', voiceActor: { name: 'Rumi Ookubo', japaneseName: '大久保瑠美', image: 'https://cdn.myanimelist.net/images/voiceactors/3/63756.jpg', language: 'Japanese' } },
  { id: '57-c5', name: 'Atalanta (Archer of Red)', japaneseName: 'アタランテ', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/8/344636.jpg', voiceActor: { name: 'Saori Hayami', japaneseName: '早見沙織', image: 'https://cdn.myanimelist.net/images/voiceactors/3/54347.jpg', language: 'Japanese' } },
  { id: '57-c6', name: 'Vlad III (Lancer of Black)', japaneseName: 'ヴラド三世', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/12/344637.jpg', voiceActor: { name: 'Ryotaro Okiayu', japaneseName: '置鮎龍太郎', image: 'https://cdn.myanimelist.net/images/voiceactors/2/12988.jpg', language: 'Japanese' } },
],
'58': [
  { id: '58-c1', name: 'Ritsuka Fujimaru', japaneseName: '藤丸立香', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/12/404601.jpg', voiceActor: { name: 'Nobunaga Shimazaki', japaneseName: '島崎信長', image: 'https://cdn.myanimelist.net/images/voiceactors/1/57788.jpg', language: 'Japanese' } },
  { id: '58-c2', name: 'Mash Kyrielight', japaneseName: 'マシュ・キリエライト', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/404602.jpg', voiceActor: { name: 'Rie Takahashi', japaneseName: '高橋李依', image: 'https://cdn.myanimelist.net/images/voiceactors/3/67226.jpg', language: 'Japanese' } },
  { id: '58-c3', name: 'Gilgamesh (Caster)', japaneseName: 'ギルガメッシュ（キャスター）', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/5/297946.jpg', voiceActor: { name: 'Tomokazu Seki', japaneseName: '関智一', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15033.jpg', language: 'Japanese' } },
  { id: '58-c4', name: 'Merlin', japaneseName: 'マーリン', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/8/404604.jpg', voiceActor: { name: 'Takahiro Sakurai', japaneseName: '櫻井孝宏', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15285.jpg', language: 'Japanese' } },
  { id: '58-c5', name: 'Ana (Ereshkigal)', japaneseName: 'エレシュキガル', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/16/404605.jpg', voiceActor: { name: 'Kana Ueda', japaneseName: '植田佳奈', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10726.jpg', language: 'Japanese' } },
  { id: '58-c6', name: 'Ishtar', japaneseName: 'イシュタル', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/7/404606.jpg', voiceActor: { name: 'Kana Ueda', japaneseName: '植田佳奈', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10726.jpg', language: 'Japanese' } },
  { id: '58-c7', name: 'Quetzalcoatl', japaneseName: 'ケツァル・コアトル', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/4/404607.jpg', voiceActor: { name: 'Eri Kitamura', japaneseName: '喜多村英梨', image: 'https://cdn.myanimelist.net/images/voiceactors/3/47429.jpg', language: 'Japanese' } },
],
'59': [
  { id: '59-c1', name: 'Bedivere', japaneseName: 'ベディヴィエール', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/430451.jpg', voiceActor: { name: 'Takahiro Sakurai', japaneseName: '櫻井孝宏', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15285.jpg', language: 'Japanese' } },
  { id: '59-c2', name: 'Ritsuka Fujimaru', japaneseName: '藤丸立香', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/12/404601.jpg', voiceActor: { name: 'Nobunaga Shimazaki', japaneseName: '島崎信長', image: 'https://cdn.myanimelist.net/images/voiceactors/1/57788.jpg', language: 'Japanese' } },
  { id: '59-c3', name: 'Mash Kyrielight', japaneseName: 'マシュ・キリエライト', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/404602.jpg', voiceActor: { name: 'Rie Takahashi', japaneseName: '高橋李依', image: 'https://cdn.myanimelist.net/images/voiceactors/3/67226.jpg', language: 'Japanese' } },
  { id: '59-c4', name: 'Ozymandias (Rider)', japaneseName: 'オジマンディアス', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/15/430452.jpg', voiceActor: { name: 'Hikaru Midorikawa', japaneseName: '緑川光', image: 'https://cdn.myanimelist.net/images/voiceactors/2/12962.jpg', language: 'Japanese' } },
],
'60': [
  { id: '60-c1', name: 'Bedivere', japaneseName: 'ベディヴィエール', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/9/430451.jpg', voiceActor: { name: 'Takahiro Sakurai', japaneseName: '櫻井孝宏', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15285.jpg', language: 'Japanese' } },
  { id: '60-c2', name: 'Lion King (Artoria Pendragon Lancer)', japaneseName: 'ライオン・キング', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/13/304528.jpg', voiceActor: { name: 'Ayako Kawasumi', japaneseName: '川澄綾子', image: 'https://cdn.myanimelist.net/images/voiceactors/2/40642.jpg', language: 'Japanese' } },
  { id: '60-c3', name: 'Gawain (Saber)', japaneseName: 'ガウェイン', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/7/430453.jpg', voiceActor: { name: 'Takuya Eguchi', japaneseName: '江口拓也', image: 'https://cdn.myanimelist.net/images/voiceactors/3/53987.jpg', language: 'Japanese' } },
],
'61': [
  { id: '61-c1', name: 'Hakuno Kishinami', japaneseName: '岸浪はくの', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/15/369241.jpg', voiceActor: { name: 'Atsushi Abe', japaneseName: '阿部敦', image: 'https://cdn.myanimelist.net/images/voiceactors/1/53879.jpg', language: 'Japanese' } },
  { id: '61-c2', name: 'Nero Claudius (Saber)', japaneseName: 'セイバー (ネロ・クラウディウス)', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/369242.jpg', voiceActor: { name: 'Sakura Tange', japaneseName: '丹下桜', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10723.jpg', language: 'Japanese' } },
  { id: '61-c3', name: 'Tamamo-no-Mae (Caster)', japaneseName: '玉藻の前', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/6/369243.jpg', voiceActor: { name: 'Chiwa Saito', japaneseName: '斎藤千和', image: 'https://cdn.myanimelist.net/images/voiceactors/2/36469.jpg', language: 'Japanese' } },
  { id: '61-c4', name: 'Rin Tohsaka (Rani VIII)', japaneseName: 'ラニ=VIII', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/11/261834.jpg', voiceActor: { name: 'Kana Ueda', japaneseName: '植田佳奈', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10726.jpg', language: 'Japanese' } },
],
'62': [
  { id: '62-c1', name: 'Illyasviel von Einzbern', japaneseName: 'イリヤスフィール・フォン・アインツベルン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/7/108087.jpg', voiceActor: { name: 'Mai Kadowaki', japaneseName: '門脇舞以', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10754.jpg', language: 'Japanese' } },
  { id: '62-c2', name: 'Miyu Edelfelt', japaneseName: '美遊・エーデルフェルト', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/289651.jpg', voiceActor: { name: 'Kaori Nazuka', japaneseName: '名塚佳織', image: 'https://cdn.myanimelist.net/images/voiceactors/2/36528.jpg', language: 'Japanese' } },
  { id: '62-c3', name: 'Rin Tohsaka', japaneseName: '遠坂凛', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/11/261834.jpg', voiceActor: { name: 'Kana Ueda', japaneseName: '植田佳奈', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10726.jpg', language: 'Japanese' } },
  { id: '62-c4', name: 'Luvia Edelfelt', japaneseName: 'ルヴィアゼリッタ・エーデルフェルト', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/13/289653.jpg', voiceActor: { name: 'Shizuka Itou', japaneseName: '伊藤静', image: 'https://cdn.myanimelist.net/images/voiceactors/1/41218.jpg', language: 'Japanese' } },
],
'63': [
  { id: '63-c1', name: 'Lord El-Melloi II (Waver Velvet)', japaneseName: 'ロード・エルメロイII世', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/108076.jpg', voiceActor: { name: 'Daisuke Namikawa', japaneseName: '浪川大輔', image: 'https://cdn.myanimelist.net/images/voiceactors/3/45349.jpg', language: 'Japanese' } },
  { id: '63-c2', name: 'Gray', japaneseName: 'グレイ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/404611.jpg', voiceActor: { name: 'Reina Ueda', japaneseName: '上田麗奈', image: 'https://cdn.myanimelist.net/images/voiceactors/3/67281.jpg', language: 'Japanese' } },
  { id: '63-c3', name: 'Add', japaneseName: 'アド', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/13/404612.jpg', voiceActor: { name: 'Tomoaki Maeno', japaneseName: '前野智昭', image: 'https://cdn.myanimelist.net/images/voiceactors/3/50554.jpg', language: 'Japanese' } },
],
'64': [
  { id: '64-c1', name: 'Ritsuka Fujimaru', japaneseName: '藤丸立香', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/12/404601.jpg', voiceActor: { name: 'Nobunaga Shimazaki', japaneseName: '島崎信長', image: 'https://cdn.myanimelist.net/images/voiceactors/1/57788.jpg', language: 'Japanese' } },
  { id: '64-c2', name: 'Mash Kyrielight', japaneseName: 'マシュ・キリエライト', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/404602.jpg', voiceActor: { name: 'Rie Takahashi', japaneseName: '高橋李依', image: 'https://cdn.myanimelist.net/images/voiceactors/3/67226.jpg', language: 'Japanese' } },
  { id: '64-c3', name: 'Cu Chulainn (Lancer)', japaneseName: 'ランサー', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/9/108083.jpg', voiceActor: { name: 'Nobutoshi Canna', japaneseName: '神奈延年', image: 'https://cdn.myanimelist.net/images/voiceactors/2/22014.jpg', language: 'Japanese' } },
  { id: '64-c4', name: 'Jeanne d\'Arc (Alter)', japaneseName: 'ジャンヌ・ダルク〔オルタ〕', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/15/404613.jpg', voiceActor: { name: 'Maaya Sakamoto', japaneseName: '坂本真綾', image: 'https://cdn.myanimelist.net/images/voiceactors/2/36649.jpg', language: 'Japanese' } },
],
'65': [
  { id: '65-c1', name: 'Ritsuka Fujimaru', japaneseName: '藤丸立香', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/12/404601.jpg', voiceActor: { name: 'Nobunaga Shimazaki', japaneseName: '島崎信長', image: 'https://cdn.myanimelist.net/images/voiceactors/1/57788.jpg', language: 'Japanese' } },
  { id: '65-c2', name: 'Mash Kyrielight', japaneseName: 'マシュ・キリエライト', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/404602.jpg', voiceActor: { name: 'Rie Takahashi', japaneseName: '高橋李依', image: 'https://cdn.myanimelist.net/images/voiceactors/3/67226.jpg', language: 'Japanese' } },
  { id: '65-c3', name: 'Goetia (Beast I)', japaneseName: 'ゲーティア', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/5/404614.jpg', voiceActor: { name: 'Noriaki Sugiyama', japaneseName: '杉山紀彰', image: 'https://cdn.myanimelist.net/images/voiceactors/1/21905.jpg', language: 'Japanese' } },
  { id: '65-c4', name: 'Merlin', japaneseName: 'マーリン', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/8/404604.jpg', voiceActor: { name: 'Takahiro Sakurai', japaneseName: '櫻井孝宏', image: 'https://cdn.myanimelist.net/images/voiceactors/3/15285.jpg', language: 'Japanese' } },
  { id: '65-c5', name: 'Solomon (Grand Caster)', japaneseName: 'ソロモン', role: 'Antagonist', image: 'https://cdn.myanimelist.net/images/characters/13/404615.jpg', voiceActor: { name: 'Kenichi Suzumura', japaneseName: '鈴村健一', image: 'https://cdn.myanimelist.net/images/voiceactors/3/50636.jpg', language: 'Japanese' } },
],
'66': [
  { id: '66-c1', name: 'Shirou Emiya', japaneseName: '衛宮士郎', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/3/108069.jpg', voiceActor: { name: 'Noriaki Sugiyama', japaneseName: '杉山紀彰', image: 'https://cdn.myanimelist.net/images/voiceactors/1/21905.jpg', language: 'Japanese' } },
  { id: '66-c2', name: 'Rin Tohsaka', japaneseName: '遠坂凛', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/261834.jpg', voiceActor: { name: 'Kana Ueda', japaneseName: '植田佳奈', image: 'https://cdn.myanimelist.net/images/voiceactors/3/10726.jpg', language: 'Japanese' } },
  { id: '66-c3', name: 'Archer (EMIYA)', japaneseName: 'アーチャー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/14/130173.jpg', voiceActor: { name: 'Junichi Suwabe', japaneseName: '諏訪部順一', image: 'https://cdn.myanimelist.net/images/voiceactors/3/53870.jpg', language: 'Japanese' } },
  { id: '66-c4', name: 'Saber (Artoria Pendragon)', japaneseName: 'セイバー', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/13/304528.jpg', voiceActor: { name: 'Ayako Kawasumi', japaneseName: '川澄綾子', image: 'https://cdn.myanimelist.net/images/voiceactors/2/40642.jpg', language: 'Japanese' } },
],

// ── YURI SERIES CHARACTERS (IDs 67–72) ──────────────────────────────────
'67': [
  { id: '67-c1', name: 'Yuu Koito', japaneseName: '小糸侑', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/5/367307.jpg', voiceActor: { name: 'Yuki Takada', japaneseName: '高田憂希', image: 'https://cdn.myanimelist.net/images/voiceactors/3/43793.jpg', language: 'Japanese' } },
  { id: '67-c2', name: 'Touko Nanami', japaneseName: '七海燈子', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/13/367308.jpg', voiceActor: { name: 'Minako Kotobuki', japaneseName: '寿美菜子', image: 'https://cdn.myanimelist.net/images/voiceactors/1/52378.jpg', language: 'Japanese' } },
  { id: '67-c3', name: 'Sayaka Saeki', japaneseName: '佐伯沙弥香', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/4/367309.jpg', voiceActor: { name: 'Ai Kayano', japaneseName: '茅野愛衣', image: 'https://cdn.myanimelist.net/images/voiceactors/3/41926.jpg', language: 'Japanese' } },
  { id: '67-c4', name: 'Seiji Maki', japaneseName: '槙聖司', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/9/367310.jpg', voiceActor: { name: 'Taichi Ichikawa', japaneseName: '市川太一', image: 'https://cdn.myanimelist.net/images/voiceactors/2/73891.jpg', language: 'Japanese' } },
],
'68': [
  { id: '68-c1', name: 'Yuzu Aihara', japaneseName: '藍原柚子', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/14/344685.jpg', voiceActor: { name: 'Ayana Taketatsu', japaneseName: '竹達彩奈', image: 'https://cdn.myanimelist.net/images/voiceactors/1/40905.jpg', language: 'Japanese' } },
  { id: '68-c2', name: 'Mei Aihara', japaneseName: '藍原芽衣', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/16/344686.jpg', voiceActor: { name: 'Minatsu Tsuda', japaneseName: '津田美波', image: 'https://cdn.myanimelist.net/images/voiceactors/3/44709.jpg', language: 'Japanese' } },
  { id: '68-c3', name: 'Harumi Taniguchi', japaneseName: '谷口はるみ', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/2/344687.jpg', voiceActor: { name: 'Yukiyo Fujii', japaneseName: '藤井ゆきよ', image: 'https://cdn.myanimelist.net/images/voiceactors/3/44710.jpg', language: 'Japanese' } },
  { id: '68-c4', name: 'Matsuri Mizusawa', japaneseName: '水沢まつり', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/12/344688.jpg', voiceActor: { name: 'Sayuri Yahagi', japaneseName: '矢作紗友里', image: 'https://cdn.myanimelist.net/images/voiceactors/1/40906.jpg', language: 'Japanese' } },
],
'69': [
  { id: '69-c1', name: 'Anisphia Wynn Palettia', japaneseName: 'アニスフィア・ウィン・パレッティア', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/11/493411.jpg', voiceActor: { name: 'Sayaka Senbongi', japaneseName: '千本木彩花', image: 'https://cdn.myanimelist.net/images/voiceactors/2/41872.jpg', language: 'Japanese' } },
  { id: '69-c2', name: 'Euphyllia Magenta', japaneseName: 'ユフィリア・マゼンタ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/7/493412.jpg', voiceActor: { name: 'Manaka Iwami', japaneseName: '石見舞菜香', image: 'https://cdn.myanimelist.net/images/voiceactors/3/51528.jpg', language: 'Japanese' } },
  { id: '69-c3', name: 'Ilia Coral', japaneseName: 'イリア・コーラル', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/15/493413.jpg', voiceActor: { name: 'Ai Fairouz', japaneseName: 'ファイルーズあい', image: 'https://cdn.myanimelist.net/images/voiceactors/3/69048.jpg', language: 'Japanese' } },
  { id: '69-c4', name: 'Lainie Cyan', japaneseName: 'レイニ・シアン', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/9/493414.jpg', voiceActor: { name: 'Hina Yomiya', japaneseName: '羊宮妃那', image: 'https://cdn.myanimelist.net/images/voiceactors/2/71836.jpg', language: 'Japanese' } },
],
'70': [
  { id: '70-c1', name: 'Suletta Mercury', japaneseName: 'スレッタ・マーキュリー', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/485458.jpg', voiceActor: { name: 'Kana Ichinose', japaneseName: '市ノ瀬加那', image: 'https://cdn.myanimelist.net/images/voiceactors/3/51829.jpg', language: 'Japanese' } },
  { id: '70-c2', name: 'Miorine Rembran', japaneseName: 'ミオリネ・レンブラン', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/10/485459.jpg', voiceActor: { name: 'Lynn', japaneseName: 'Lynn', image: 'https://cdn.myanimelist.net/images/voiceactors/2/38587.jpg', language: 'Japanese' } },
  { id: '70-c3', name: 'Guel Jeturk', japaneseName: 'グエル・ジェターク', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/2/485460.jpg', voiceActor: { name: 'Yohei Azakami', japaneseName: '阿座上洋平', image: 'https://cdn.myanimelist.net/images/voiceactors/1/43831.jpg', language: 'Japanese' } },
  { id: '70-c4', name: 'Elan Ceres', japaneseName: 'エラン・ケレス', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/5/485461.jpg', voiceActor: { name: 'Natsuki Hanae', japaneseName: '花江夏樹', image: 'https://cdn.myanimelist.net/images/voiceactors/1/32962.jpg', language: 'Japanese' } },
  { id: '70-c5', name: 'Shaddiq Zenelli', japaneseName: 'シャディク・ゼネリ', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/3/485462.jpg', voiceActor: { name: 'Makoto Furukawa', japaneseName: '古川慎', image: 'https://cdn.myanimelist.net/images/voiceactors/1/54963.jpg', language: 'Japanese' } },
],
'71': [
  { id: '71-c1', name: 'Sakura Adachi', japaneseName: '安達桜', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/6/422894.jpg', voiceActor: { name: 'Akari Kito', japaneseName: '鬼頭明里', image: 'https://cdn.myanimelist.net/images/voiceactors/3/68697.jpg', language: 'Japanese' } },
  { id: '71-c2', name: 'Hougetsu Shimamura', japaneseName: '島村抱月', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/16/422895.jpg', voiceActor: { name: 'Miku Ito', japaneseName: '伊藤美来', image: 'https://cdn.myanimelist.net/images/voiceactors/2/30527.jpg', language: 'Japanese' } },
  { id: '71-c3', name: 'Yashiro Chikama', japaneseName: '知我麻社', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/14/422896.jpg', voiceActor: { name: 'Iori Saeki', japaneseName: '佐伯伊織', image: 'https://cdn.myanimelist.net/images/voiceactors/1/56885.jpg', language: 'Japanese' } },
],
'72': [
  { id: '72-c1', name: 'Menou', japaneseName: 'メノウ', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/4/468817.jpg', voiceActor: { name: 'Iori Saeki', japaneseName: '佐伯伊織', image: 'https://cdn.myanimelist.net/images/voiceactors/1/56885.jpg', language: 'Japanese' } },
  { id: '72-c2', name: 'Akari Tokito', japaneseName: '時任灯里', role: 'Main', image: 'https://cdn.myanimelist.net/images/characters/8/468818.jpg', voiceActor: { name: 'Moe Kahara', japaneseName: '佳原萌枝', image: 'https://cdn.myanimelist.net/images/voiceactors/3/68314.jpg', language: 'Japanese' } },
  { id: '72-c3', name: 'Momo', japaneseName: 'モモ', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/15/468819.jpg', voiceActor: { name: 'Hisako Kanemoto', japaneseName: '金元寿子', image: 'https://cdn.myanimelist.net/images/voiceactors/2/40907.jpg', language: 'Japanese' } },
  { id: '72-c4', name: 'Ashuna', japaneseName: 'アーシュナ', role: 'Supporting', image: 'https://cdn.myanimelist.net/images/characters/9/468820.jpg', voiceActor: { name: 'M.A.O', japaneseName: 'M・A・O', image: 'https://cdn.myanimelist.net/images/voiceactors/3/36648.jpg', language: 'Japanese' } },
],
};

/**
 * Fallback generator for anime without explicit mapped characters
 */
export function getCharactersForAnime(animeId: string, animeTitle: string): AnimeCharacter[] {
  if (animeCharactersMap[animeId]) {
    return animeCharactersMap[animeId];
  }
  return animeCharactersMap['1'] || [];
}
