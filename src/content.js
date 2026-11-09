// Editorial content for the tribute sections. All text is original.
// `album` is an index into ALBUMS for linking and accent colour.

export const TIMELINE = [
  { year: 1985, title: 'On A Friday', album: 0, text: 'Five students at Abingdon School in Oxfordshire start rehearsing together on Fridays: Thom Yorke, Colin Greenwood, Ed O’Brien and Philip Selway, with Jonny Greenwood joining soon after. The band is called On A Friday.', img: 'abingdon' },
  { year: 1991, title: 'Signed, and renamed', album: 0, text: 'After years of Oxford gigs and university breaks, they sign to EMI and take a new name borrowed from a Talking Heads song. Radiohead is born.', img: 'stage' },
  { year: 1992, title: 'Drill and Creep', album: 0, text: 'The Drill EP arrives, then a single called Creep. It stalls at first, then slowly turns into a worldwide calling card, for better and worse.', img: 'coachella04' },
  { year: 1993, title: 'Pablo Honey', album: 0, text: 'The debut album lands in February. Creep takes off in the United States and the band spend the next year on the road.', img: 'ella' },
  { year: 1995, title: 'The Bends', album: 1, text: 'The second album is a leap in ambition: bigger guitars, braver songs and a clear move away from the debut. Fake Plastic Trees and Street Spirit become fan favourites.', img: 'blackpool' },
  { year: 1997, title: 'OK Computer', album: 2, text: 'A dense, anxious record about speed, travel and technology becomes one of the most praised albums of its decade. The summer includes a Glastonbury headline set that fans still talk about.', img: 'coachella12' },
  { year: 1998, title: 'Meeting People Is Easy', album: 2, text: 'Director Grant Gee releases a documentary about the exhausting OK Computer tour. It is as much about the machinery of fame as it is about the band.', img: 'france08' },
  { year: 2000, title: 'Kid A', album: 3, text: 'Guitars step back and electronics, strings and jazz-minded arrangements step forward. With no singles and little conventional promotion, the album still debuts at number one in the United States.', img: 'bcn02' },
  { year: 2001, title: 'Amnesiac', album: 4, text: 'Recorded in the same sessions as Kid A, the follow-up is stranger and more handmade, with packaging made to look like a worn library book.', img: 'colin-bristow' },
  { year: 2003, title: 'Hail to the Thief', album: 5, text: 'A fast, restless record made in a short burst, full of unease about the news cycle and the world outside the studio.', img: 'bcn05' },
  { year: 2006, title: 'The Eraser', album: 5, text: 'Thom Yorke releases his first solo album, built from laptop beats and fragile melodies. It opens a long run of side projects across the whole band.', img: 'thom-glasto' },
  { year: 2007, title: 'In Rainbows', album: 6, text: 'Announced with about ten days’ notice and released as a download where fans choose the price, including nothing. The music is warm, rhythmic and detailed, and the release changes how people talk about distribution.', img: 'bcn01' },
  { year: 2009, title: 'Grammy recognition', album: 6, text: 'In Rainbows wins the Grammy for Best Alternative Music Album, and its special edition package is honoured as well.', img: 'glasto-band' },
  { year: 2011, title: 'The King of Limbs', album: 7, text: 'A compact, loop-based album arrives first as a download and later in an elaborate physical edition styled like a newspaper.', img: 'jonny-glasto' },
  { year: 2016, title: 'A Moon Shaped Pool', album: 8, text: 'The band wipe their online presence clean, then release the Burn the Witch video, an animated short in a vintage children’s TV style. The album follows with orchestral strings and songs that had waited years for the right setting.', img: 'thom2016' },
  { year: 2017, title: 'OKNOTOK and Glastonbury', album: 2, text: 'OK Computer turns twenty with an expanded reissue, and the band headline Glastonbury again.', img: 'pyramid' },
  { year: 2019, title: 'Hall of Fame, and the tapes', album: 2, text: 'Radiohead are inducted into the Rock and Roll Hall of Fame. Months later, after a leak of archived recordings from the OK Computer era, the band release them in full for a limited time, with proceeds going to climate activism.', img: 'rrhof' },
  { year: 2021, title: 'Kid A Mnesia', album: 3, text: 'A twenty-first anniversary package combines Kid A, Amnesiac and unreleased material, alongside an interactive digital exhibition built around Stanley Donwood’s art.', img: 'bcn07' },
  { year: 2022, title: 'The Smile', album: 8, text: 'Thom Yorke and Jonny Greenwood, with drummer Tom Skinner, release their first album as The Smile, extending the band’s family tree.', img: 'smile' },
  { year: 2025, title: 'Back on stage', album: 8, text: 'After a long break from live shows, the band return to the stage with a run of dates across Europe.', img: 'berlin' },
];

export const BAND = [
  {
    img: 'thom', name: 'Thom Yorke', born: 1968, role: 'Vocals · guitar · piano · electronics',
    text: 'The voice and principal songwriter. Alongside Radiohead he has made solo records including The Eraser and Anima, formed the group Atoms for Peace, and co-founded The Smile.',
  },
  {
    img: 'jonny', name: 'Jonny Greenwood', born: 1971, role: 'Guitar · keyboards · ondes Martenot · arrangements',
    text: 'The band’s great experimenter, as comfortable with a wall of feedback as with a string section. He is also a film composer, with scores for There Will Be Blood, Phantom Thread and The Power of the Dog, the last two Oscar-nominated.',
  },
  {
    img: 'colin', name: 'Colin Greenwood', born: 1969, role: 'Bass · keyboards · synthesizers',
    text: 'Jonny’s older brother and the anchor of the low end. Colin’s melodic bass lines carry songs from Paranoid Android to Weird Fishes.',
  },
  {
    img: 'ed', name: 'Ed O’Brien', born: 1968, role: 'Guitar · backing vocals · effects',
    text: 'The architect of many of the band’s atmospheres, with a pedalboard-driven sound that fills the space between the notes. His 2020 solo album Earth was released under the name EOB.',
  },
  {
    img: 'phil', name: 'Philip Selway', born: 1967, role: 'Drums · percussion',
    text: 'The steady, subtle engine of the band, comfortable in odd time signatures and electronic textures. He has also released solo albums, including Familial and Weatherhouse.',
  },
];

export const COLLABORATORS = [
  { name: 'Nigel Godrich', role: 'Producer', text: 'Worked on The Bends as an engineer, then produced every album from OK Computer onward. Often called the band’s sixth member.' },
  { img: 'donwood', name: 'Stanley Donwood', role: 'Artist', text: 'Creates the band’s artwork, from the jagged mountains of Kid A to the library-book packaging of Amnesiac, often working closely with Thom Yorke.' },
];

export const STORIES = [
  {
    tag: 'ORIGINS', title: 'Five friends, one school', img: 'amey',
    text: 'Radiohead began in a school music room in Abingdon, where a group of friends rehearsed on Fridays and played under the name On A Friday. They scattered to universities, kept the band alive in the holidays, and came back together when a record deal appeared. The name change came with it, taken from a Talking Heads song. The first thing you notice about the early story is how ordinary it is: friends, amps and persistence.',
  },
  {
    tag: 'PABLO HONEY', title: 'The song that escaped', img: 'bcn03',
    text: 'Creep began as one song on a debut album and turned into a global shadow. It made the band famous in a way they did not choose, and for years it framed how people heard everything else. The next two albums are, in part, a reply: restless, wider in scope, and impossible to reduce to one hit.',
  },
  {
    tag: 'OK COMPUTER', title: 'A mansion near Bath', img: 'composite',
    text: 'Much of OK Computer was recorded in a large country house, where the band used different rooms for their natural echo and tried to capture songs as they happened. Working with Nigel Godrich, they kept rough edges and unusual takes. The result sounds like a band trying to describe the speed of the late nineties from inside a moving car.',
  },
  {
    tag: 'TOUR LIFE', title: 'Meeting People Is Easy', img: 'france08',
    text: 'After OK Computer, the band spent more than a year on tour. A documentary by Grant Gee followed along, cutting the road into loops of interviews, soundchecks, airports and screens. It showed how strange it was to be asked the same questions in a different city every day, and it fed directly into the next record.',
  },
  {
    tag: 'KID A', title: 'Taking the band apart', img: 'glasto-thom',
    text: 'For Kid A the group put aside the guitar-driven sound that had made them famous. They listened to electronic labels, jazz and German experimental bands, and rebuilt their songs around synthesizers, samples and strings. The album arrived with almost no singles or conventional promotion, yet it reached number one in the United States and is now routinely listed among the best albums of its era.',
  },
  {
    tag: 'ARTWORK', title: 'A visual language', img: 'donwood-thom',
    text: 'Stanley Donwood, with Thom Yorke working under the pseudonym Dr. Tchock, gave the band a distinct look: wintry landscapes, scrawled maps, and dense collage. Amnesiac came in a package that resembled a library book. The King of Limbs received a newspaper edition. The art is not decoration; it is a second set of liner notes.',
  },
  {
    tag: 'IN RAINBOWS', title: 'Name your price', img: 'bcn02',
    text: 'In 2007 the band announced In Rainbows with only a short wait, and let fans download it for any price they wished. Millions of conversations followed about what music is worth and who controls its release. The record itself is warm, detailed and rhythmic, and many fans consider it the band at their most human.',
  },
  {
    tag: 'A MOON SHAPED POOL', title: 'The blank page', img: 'jonny-ams',
    text: 'In May 2016 the band deleted their websites and social media. Fans noticed the empty pages, and days later a stop-motion video for Burn the Witch appeared, with the album soon after. It was a lesson in how to build anticipation: silence, a clean slate, and then music that makes use of strings, piano and long-held songs.',
  },
  {
    tag: 'THE ARCHIVE', title: 'Lost tapes, set free', img: 'berlin62',
    text: 'In 2019 a collection of old recordings from the OK Computer period was stolen and threatened with sale. The band responded by releasing the material themselves for a short window, with the money going to climate action. They had lost control of the tapes, and they decided to give them away on their own terms.',
  },
];
