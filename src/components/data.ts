export const ZONES = [
  {id:"vendors",name:"Vendors & bookings",em:"\ud83e\uddfe"},
  {id:"venue",name:"Venue & church",em:"\u26ea"},
  {id:"guests",name:"Guest management",em:"\ud83d\udc8c"},
  {id:"design",name:"Design & styling",em:"\ud83c\udf38"},
  {id:"personal",name:"Bridal party & personal",em:"\ud83d\udc8d"},
  {id:"food",name:"Food & drink",em:"\ud83c\udf70"},
  {id:"legal",name:"Legal & admin",em:"\ud83d\udcdd"},
  {id:"finalweek",name:"Final week",em:"\ud83d\udcc5"},
  {id:"morning",name:"Morning of",em:"\u2600\ufe0f"},
  {id:"ceremony",name:"Ceremony",em:"\ud83d\udc92"},
  {id:"gap",name:"The gap",em:"\ud83d\udcf7"},
  {id:"reception",name:"Reception",em:"\ud83c\udf89"},
  {id:"endofnight",name:"End of night",em:"\ud83c\udf19"},
  {id:"postwedding",name:"Post-wedding",em:"\u2764\ufe0f"},
]

export const STATUSES: Record<string, {bg:string,tx:string,lb:string}> = {
  "not-started":{bg:"#f0eeea",tx:"#8a8883",lb:"Not started"},
  "in-progress":{bg:"#e8f0f8",tx:"#4a7a9e",lb:"In progress"},
  "waiting":{bg:"#fef5e7",tx:"#9a7a3a",lb:"Waiting on someone"},
  "needs-discussion":{bg:"#f0ecf8",tx:"#6a5a8f",lb:"Needs discussion"},
  "done":{bg:"#e8f5ee",tx:"#3a7a5a",lb:"Done"},
}

export const BUDGET_STATES: Record<string, {bg:string,tx:string,lb:string}> = {
  quoted:{bg:"#f0ecf8",tx:"#6a5a8f",lb:"Quoted"},
  deposited:{bg:"#fef5e7",tx:"#9a7a3a",lb:"Deposited"},
  paid:{bg:"#e8f5ee",tx:"#3a7a5a",lb:"Paid in full"},
}

export const PHASES = [
  {id:"mar",name:"March 2026",color:"#c97a6a"},
  {id:"apr",name:"April",color:"#b98a6a"},
  {id:"may",name:"May",color:"#a99a6a"},
  {id:"jun",name:"June",color:"#8aaa6a"},
  {id:"jul",name:"July \u2013 August",color:"#6a9a8a"},
  {id:"sep",name:"September \u2013 October",color:"#6a8aaa"},
  {id:"nov",name:"November (final weeks)",color:"#8a6aaa"},
  {id:"week",name:"Final week",color:"#c97a8a"},
  {id:"after",name:"After the wedding",color:"#9a8a7a"},
]

export const BUDGET_CATS = [
  {id:"venue",name:"Venue & logistics",em:"\u26ea"},
  {id:"food",name:"Food & drink",em:"\ud83c\udf70"},
  {id:"bridal",name:"Bridal prep",em:"\ud83d\udc8d"},
  {id:"decor",name:"Styling & decor",em:"\ud83c\udf38"},
  {id:"entertainment",name:"Entertainment",em:"\ud83c\udfb5"},
  {id:"other",name:"Other",em:"\ud83d\udccc"},
]

export type Task = {
  id: string; zone: string; task: string; status: string;
  owner: string; dep: string; notes: string; phase: string; ord: number;
}

export type BudgetItem = {
  id: string; cat: string; amt: number; st: string; n: string; g: string;
  vendorName?: string; vendorPhone?: string; vendorEmail?: string;
}

export type TimelineEvent = {
  id: string; t: string; e: string; w: string; big?: boolean;
  locId?: string; view?: 'both' | 'bride' | 'groom';
}

export type MapLocation = {
  id: string; name: string; lat: number; lng: number; color: string; address: string;
}

export type Note = {
  id: string; text: string; createdAt: number; catId?: string;
}

export type ChainStep = {
  id: string; what: string; who: string; when: string; where: string;
  notes: string; status: 'done' | 'planned' | 'gap'; dayTime?: string;
}

export type Chain = {
  id: string; name: string; color: string; catId: string; span: string; steps: ChainStep[];
}

export const CATEGORIES = [
  {id:"venue",name:"Venue + church",color:"#c97a6a",em:"\u26ea"},
  {id:"ceremony",name:"Ceremony",color:"#8a6aaa",em:"\ud83d\udc92"},
  {id:"bridal",name:"Bridal party",color:"#6a9a8a",em:"\ud83d\udc8d"},
  {id:"food",name:"Food + drink",color:"#6a8aaa",em:"\ud83c\udf70"},
  {id:"decor",name:"Styling + decor",color:"#b98a6a",em:"\ud83c\udf38"},
  {id:"entertainment",name:"Entertainment",color:"#c97a8a",em:"\ud83c\udfb5"},
  {id:"legal",name:"Legal + admin",color:"#3a7a5a",em:"\ud83d\udcdd"},
  {id:"transport",name:"Transport",color:"#9a7a3a",em:"\ud83d\ude97"},
  {id:"logistics",name:"Day-of logistics",color:"#8a8580",em:"\ud83d\udce6"},
  {id:"people",name:"People roles",color:"#c04848",em:"\ud83d\udc65"},
]

export const LOCATIONS: MapLocation[] = [
  {id:"bride",name:"Bride's house",lat:-37.87,lng:145.00,color:"#6a8aaa",address:""},
  {id:"groom",name:"Groom's house",lat:-37.95,lng:145.14,color:"#9a7a3a",address:""},
  {id:"church",name:"St Kilda church",lat:-37.8588,lng:144.9966,color:"#c97a6a",address:"208 Dandenong Rd, St Kilda East"},
  {id:"ripponlea",name:"Ripponlea Estate",lat:-37.8786,lng:144.9978,color:"#8a6aaa",address:"192 Hotham St, Elsternwick"},
  {id:"venue",name:"Mentone venue",lat:-37.9814,lng:145.0699,color:"#3a7a5a",address:"Mentone"},
  {id:"hotel",name:"Richmond hotel",lat:-37.8183,lng:145.0000,color:"#4a7a9e",address:"Richmond"},
]

export const INITIAL_CHAINS: Chain[] = [
  {id:"ch1",name:"Legal + documents",color:"#3a7a5a",catId:"legal",span:"Mar \u2192 Post",steps:[
    {id:"ls1",what:"Gather original birth certs / passports",who:"",when:"Mar",where:"Home",notes:"Needed for NOIM",status:"gap"},
    {id:"ls2",what:"Lodge NOIM with priest",who:"Both",when:"Mar",where:"Church",notes:"Legal requirement, 1+ month before",status:"gap"},
    {id:"ls3",what:"Confirm 2 witnesses (18+)",who:"",when:"May",where:"",notes:"Physically present at ceremony",status:"planned"},
    {id:"ls4",what:"Witnesses sign marriage docs",who:"Witnesses",when:"Day of",where:"Church",notes:"After ceremony",status:"planned",dayTime:"~1:00pm"},
    {id:"ls5",what:"Collect marriage docs at pack-down",who:"",when:"Day of",where:"Venue",notes:"DON'T LEAVE AT VENUE",status:"gap",dayTime:"10:00pm"},
    {id:"ls6",what:"Lodge marriage cert with BDM Victoria",who:"",when:"Post week 1",where:"Online",notes:"Time-sensitive",status:"planned"},
  ]},
  {id:"ch2",name:"Cake",color:"#c97a6a",catId:"food",span:"Apr \u2192 Day of",steps:[
    {id:"cs1",what:"Research cake vendors for 100",who:"Both",when:"Apr",where:"",notes:"Small cutting cake + sheet cakes",status:"planned"},
    {id:"cs2",what:"Get quotes from 2-3 vendors",who:"",when:"Apr-May",where:"",notes:"",status:"planned"},
    {id:"cs3",what:"Taste test + book vendor",who:"Both",when:"May",where:"",notes:"",status:"planned"},
    {id:"cs4",what:"Confirm flavour, size, delivery",who:"",when:"Oct",where:"",notes:"",status:"planned"},
    {id:"cs5",what:"Ask caterer to plate/serve external cake",who:"",when:"Nov",where:"",notes:"Depends on: menu finalised",status:"gap"},
    {id:"cs6",what:"Cake delivered to venue",who:"",when:"Day of",where:"Venue",notes:"WHO receives it?",status:"gap",dayTime:"2:00pm"},
    {id:"cs7",what:"Cake cutting moment",who:"Both",when:"Day of",where:"Venue",notes:"MC cues it. Photographer ready.",status:"planned",dayTime:"~8:00pm"},
    {id:"cs8",what:"Leftover cake \u2014 who takes home?",who:"",when:"Day of",where:"Venue",notes:"",status:"gap",dayTime:"10:00pm"},
  ]},
  {id:"ch3",name:"Menu + catering",color:"#6a8aaa",catId:"food",span:"Booked \u2192 Day of",steps:[
    {id:"ms1",what:"Caterer booked, deposit paid",who:"",when:"Done",where:"",notes:"$75/head, flexible",status:"done"},
    {id:"ms2",what:"Second meeting \u2014 choose dishes",who:"Both",when:"Apr",where:"",notes:"Mains, sides, shared platters. Kids menu.",status:"planned"},
    {id:"ms3",what:"Confirm canapes for cocktail hour",who:"",when:"Apr",where:"",notes:"Included or extra?",status:"planned"},
    {id:"ms4",what:"Decide bar tab amount",who:"Both",when:"Apr",where:"",notes:"$2-3k typical",status:"gap"},
    {id:"ms5",what:"Compile dietary requirements from WithJoy",who:"",when:"Sep",where:"",notes:"Depends on: RSVPs chased",status:"planned"},
    {id:"ms6",what:"Send final headcount + dietary to caterer",who:"",when:"Nov wk1",where:"",notes:"Include vendor meals, kids",status:"planned"},
    {id:"ms7",what:"Canapes served",who:"Caterer",when:"Day of",where:"Venue",notes:"Cocktail hour",status:"planned",dayTime:"4:00pm"},
    {id:"ms8",what:"Dinner served",who:"Caterer",when:"Day of",where:"Venue",notes:"Sit-down",status:"planned",dayTime:"6:00pm"},
  ]},
  {id:"ch4",name:"Flowers",color:"#8a6aaa",catId:"decor",span:"Booked \u2192 Day of",steps:[
    {id:"fs1",what:"Florist booked \u2014 $1,200",who:"",when:"Done",where:"",notes:"$500 deposit",status:"done"},
    {id:"fs2",what:"Confirm delivery logistics with florist",who:"",when:"Mar",where:"",notes:"How many locations? Pickup day before?",status:"gap"},
    {id:"fs3",what:"Final confirmation with florist",who:"",when:"Oct",where:"",notes:"Flowers, delivery, times",status:"planned"},
    {id:"fs4",what:"Bouquets + corsages to bride's house",who:"Florist",when:"Day of",where:"Bride's house",notes:"Before 9am?",status:"gap",dayTime:"~8:00am"},
    {id:"fs5",what:"Buttonholes to groom",who:"",when:"Day of",where:"?",notes:"45 MIN AWAY. Pickup day before?",status:"gap",dayTime:"~9:00am"},
    {id:"fs6",what:"Church flowers set up",who:"Florist?",when:"Day of",where:"Church",notes:"By 11am",status:"planned",dayTime:"~10:30am"},
    {id:"fs7",what:"Centrepieces to venue",who:"Setup crew",when:"Day of",where:"Venue",notes:"",status:"planned",dayTime:"2:00pm"},
    {id:"fs8",what:"End of night \u2014 flowers home?",who:"",when:"Day of",where:"Venue",notes:"Leave or pack?",status:"gap",dayTime:"10:00pm"},
  ]},
  {id:"ch5",name:"Rings",color:"#6a9a8a",catId:"bridal",span:"Now \u2192 Ceremony",steps:[
    {id:"rs1",what:"Buy wedding rings",who:"Both",when:"Now",where:"",notes:"4-6 weeks for sizing/engraving",status:"planned"},
    {id:"rs2",what:"Collect rings \u2014 check sizing",who:"Both",when:"+6 weeks",where:"Jeweller",notes:"",status:"planned"},
    {id:"rs3",what:"WHO has rings morning of?",who:"",when:"Day of",where:"",notes:"Best man? Ring wrangler?",status:"gap",dayTime:"morning"},
    {id:"rs4",what:"Kid cousins carry rings \u2014 who manages?",who:"",when:"Day of",where:"Church",notes:"Parent or bridal party member",status:"gap",dayTime:"12:00pm"},
    {id:"rs5",what:"Exchange rings at ceremony",who:"Both",when:"Day of",where:"Church",notes:"",status:"planned",dayTime:"12:00pm"},
  ]},
  {id:"ch6",name:"Readings + church music",color:"#b98a6a",catId:"ceremony",span:"Mar \u2192 Ceremony",steps:[
    {id:"rms1",what:"Meet with priest",who:"Both",when:"Mar",where:"Church",notes:"Also lodge NOIM",status:"planned"},
    {id:"rms2",what:"Decide choir ($1,600) vs cheaper",who:"Both",when:"Apr",where:"",notes:"Needs discussion",status:"gap"},
    {id:"rms3",what:"Choose readings (2 + psalm + gospel)",who:"Both",when:"May",where:"",notes:"Priest can guide",status:"planned"},
    {id:"rms4",what:"Assign readers + send text",who:"Both",when:"Jun",where:"",notes:"After readings picked",status:"planned"},
    {id:"rms5",what:"Book music \u2014 confirm with priest",who:"",when:"Jun",where:"",notes:"Processional, recessional, signing",status:"planned"},
    {id:"rms6",what:"Lock processional + recessional",who:"Both",when:"Jun",where:"",notes:"",status:"planned"},
    {id:"rms7",what:"Church rehearsal",who:"All",when:"Night before",where:"Church",notes:"Readers, processional walk-through",status:"planned"},
    {id:"rms8",what:"Performed at ceremony",who:"All",when:"Day of",where:"Church",notes:"",status:"planned",dayTime:"12:00pm"},
  ]},
  {id:"ch7",name:"Seating + stationery",color:"#8aaa6a",catId:"decor",span:"Mar \u2192 Day of",steps:[
    {id:"ss1",what:"Chase ~50 non-RSVP guests",who:"Both",when:"Mar",where:"",notes:"Text/call",status:"planned"},
    {id:"ss2",what:"Compile final guest list",who:"",when:"Sep",where:"",notes:"From WithJoy",status:"planned"},
    {id:"ss3",what:"Build seating plan",who:"Both",when:"Sep",where:"",notes:"Dynamics, kids, mum wheelchair",status:"planned"},
    {id:"ss4",what:"Design + print nameplates",who:"",when:"Oct",where:"",notes:"",status:"planned"},
    {id:"ss5",what:"Design + print menus (1 per table)",who:"",when:"Oct",where:"",notes:"Depends on: menu finalised",status:"planned"},
    {id:"ss6",what:"Setup crew places at tables",who:"Setup crew",when:"Day of",where:"Venue",notes:"Need layout plan",status:"planned",dayTime:"2:00pm"},
    {id:"ss7",what:"Collect (keepsake?)",who:"",when:"Day of",where:"Venue",notes:"",status:"planned",dayTime:"10:00pm"},
  ]},
  {id:"ch8",name:"Groom + groomsmen outfits",color:"#a99a6a",catId:"bridal",span:"Apr \u2192 Day of",steps:[
    {id:"gs1",what:"Buy groom suit + bow tie",who:"Groom",when:"Apr",where:"",notes:"Clean black",status:"planned"},
    {id:"gs2",what:"Send colour ref to 4 groomsmen",who:"Groom",when:"Jun",where:"",notes:"After suit bought",status:"planned"},
    {id:"gs3",what:"Groomsmen buy matching suits",who:"Groomsmen",when:"Jul-Sep",where:"",notes:"Own suits, coordinated",status:"planned"},
    {id:"gs4",what:"Everyone confirms + sends photo",who:"All",when:"Nov",where:"",notes:"",status:"planned"},
    {id:"gs5",what:"Suit up at groom's house",who:"All",when:"Day of",where:"Groom's house",notes:"Leave by 10:30",status:"planned",dayTime:"~9:30am"},
  ]},
  {id:"ch9",name:"DJ + entertainment",color:"#c97a8a",catId:"entertainment",span:"Mar \u2192 Day of",steps:[
    {id:"ds1",what:"Confirm speakers for DJ friend",who:"",when:"Mar",where:"",notes:"Family member has them?",status:"gap"},
    {id:"ds2",what:"Build playlist",who:"Both",when:"Jul",where:"",notes:"Must-plays + do-not-plays",status:"planned"},
    {id:"ds3",what:"Share playlist with DJ",who:"",when:"Oct",where:"",notes:"Confirm first dance",status:"planned"},
    {id:"ds4",what:"Test speakers",who:"DJ + Groom",when:"Nov",where:"Venue?",notes:"",status:"planned"},
    {id:"ds5",what:"DJ + speakers setup",who:"DJ friend",when:"Day of",where:"Venue",notes:"",status:"planned",dayTime:"2:00pm"},
    {id:"ds6",what:"First dance",who:"Both",when:"Day of",where:"Venue",notes:"Custom cousin song",status:"planned",dayTime:"7:40pm"},
    {id:"ds7",what:"Dance floor until last song",who:"DJ",when:"Day of",where:"Venue",notes:"",status:"planned",dayTime:"7:50pm"},
  ]},
  {id:"ch10",name:"Transport",color:"#9a7a3a",catId:"transport",span:"Day of",steps:[
    {id:"ts1",what:"Groom + groomsmen leave",who:"Groom",when:"Day of",where:"Groom's \u2192 church",notes:"45 min. Who drives?",status:"planned",dayTime:"10:30am"},
    {id:"ts2",what:"Sprinter picks up bride",who:"Sprinter",when:"Day of",where:"Bride's \u2192 church",notes:"$800, 5hr clock",status:"planned",dayTime:"10:45am"},
    {id:"ts3",what:"Mum's accessible vehicle",who:"",when:"Day of",where:"\u2192 church",notes:"Sorted",status:"planned",dayTime:"~11:00am"},
    {id:"ts4",what:"Car hire: church \u2192 Ripponlea",who:"Driver",when:"Day of",where:"Bride + groom",notes:"$330, 3hr",status:"planned",dayTime:"1:15pm"},
    {id:"ts5",what:"Sprinter: bridal party \u2192 Ripponlea \u2192 venue",who:"Sprinter",when:"Day of",where:"",notes:"",status:"planned",dayTime:"1:15pm"},
    {id:"ts6",what:"Car hire: Ripponlea \u2192 venue",who:"Driver",when:"Day of",where:"",notes:"",status:"planned",dayTime:"~2:30pm"},
    {id:"ts7",what:"Guests self-drive church \u2192 venue",who:"Guests",when:"Day of",where:"",notes:"Do they know the way?",status:"gap",dayTime:"~1:15pm"},
    {id:"ts8",what:"Uber to Richmond hotel",who:"Both",when:"Day of",where:"Venue \u2192 hotel",notes:"~30 min",status:"planned",dayTime:"~10:15pm"},
  ]},
  {id:"ch11",name:"Overnight bags",color:"#4a7a9e",catId:"logistics",span:"Day before \u2192 Night",steps:[
    {id:"obs1",what:"Pack overnight bags",who:"Both",when:"Night before",where:"Home",notes:"Clothes, toiletries, charger",status:"planned"},
    {id:"obs2",what:"Bags in whose car?",who:"",when:"Day of",where:"",notes:"Can't go in sprinter",status:"gap",dayTime:"morning"},
    {id:"obs3",what:"Someone checks into hotel + drops bags",who:"",when:"Day of",where:"Richmond hotel",notes:"During the gap",status:"gap",dayTime:"~3:00pm"},
    {id:"obs4",what:"Arrive at hotel \u2014 bags waiting",who:"Both",when:"Day of",where:"Hotel",notes:"",status:"planned",dayTime:"~10:30pm"},
  ]},
  {id:"ch12",name:"Decorations",color:"#8a8580",catId:"decor",span:"Now \u2192 Pack-down",steps:[
    {id:"dcs1",what:"Finalise centrepiece design",who:"Both",when:"Now",where:"",notes:"Half done",status:"planned"},
    {id:"dcs2",what:"Source battery candles + cheesecloth",who:"",when:"Jun",where:"",notes:"No real candles",status:"planned"},
    {id:"dcs3",what:"Make/order welcome sign + card box",who:"",when:"Sep",where:"",notes:"DIY or buy?",status:"planned"},
    {id:"dcs4",what:"Confirm draping with venue",who:"",when:"Nov",where:"Venue",notes:"Install cost?",status:"planned"},
    {id:"dcs5",what:"Load everything into car",who:"",when:"Day of",where:"Home \u2192 car",notes:"WHO? Which car?",status:"gap",dayTime:"morning"},
    {id:"dcs6",what:"Drive to venue by 2pm",who:"",when:"Day of",where:"\u2192 Venue",notes:"",status:"gap",dayTime:"~1:30pm"},
    {id:"dcs7",what:"Setup crew places everything",who:"Setup crew",when:"Day of",where:"Venue",notes:"Need layout plan",status:"planned",dayTime:"2:00pm"},
    {id:"dcs8",what:"Pack-down \u2014 collect ALL",who:"",when:"Day of",where:"Venue",notes:"2-3 people. Card box = CASH.",status:"gap",dayTime:"10:00pm"},
  ]},
  {id:"ch13",name:"Camcorders + DIY video",color:"#6a5a8f",catId:"logistics",span:"Jul \u2192 Post",steps:[
    {id:"vs1",what:"Source remaining camcorders + film cameras",who:"",when:"Jul",where:"",notes:"Some owned, some to source",status:"planned"},
    {id:"vs2",what:"Create mission cards for tables",who:"",when:"Oct",where:"",notes:"Instructions for guests",status:"planned"},
    {id:"vs3",what:"Charge ALL cameras",who:"",when:"Night before",where:"Home",notes:"Every single one",status:"planned"},
    {id:"vs4",what:"Cameras to both houses for morning",who:"",when:"Day of",where:"Both houses",notes:"Film getting-ready",status:"planned",dayTime:"morning"},
    {id:"vs5",what:"Setup crew places on tables",who:"Setup crew",when:"Day of",where:"Venue",notes:"+ mission cards",status:"planned",dayTime:"2:00pm"},
    {id:"vs6",what:"WHO films key moments?",who:"",when:"Day of",where:"Venue",notes:"Entrance, speeches, first dance",status:"gap",dayTime:"5:00pm"},
    {id:"vs7",what:"Collect EVERY camera",who:"",when:"Day of",where:"Venue",notes:"They WILL get lost if nobody assigned",status:"gap",dayTime:"10:00pm"},
    {id:"vs8",what:"All footage to one person",who:"",when:"Post",where:"",notes:"Compile + edit",status:"planned"},
  ]},
  {id:"ch14",name:"People roles (day-of)",color:"#c04848",catId:"people",span:"Assign by Oct",steps:[
    {id:"ps1",what:"Morning coordinator (bride's side)",who:"",when:"Assign by Oct",where:"Bride's house",notes:"Keeps morning on track",status:"gap"},
    {id:"ps2",what:"Church ushers (2)",who:"",when:"Assign by Oct",where:"Church",notes:"Seat guests, position mum",status:"gap"},
    {id:"ps3",what:"Family photo wrangler",who:"",when:"Assign by Oct",where:"Church",notes:"Rounds up people fast",status:"gap"},
    {id:"ps4",what:"Hotel check-in person",who:"",when:"Assign by Oct",where:"Hotel",notes:"Drops bags during gap",status:"gap"},
    {id:"ps5",what:"Guest greeter at venue 4pm",who:"",when:"Assign by Oct",where:"Venue",notes:"You arrive at 5pm",status:"gap"},
    {id:"ps6",what:"Vendor point of contact",who:"",when:"Assign by Oct",where:"",notes:"Who do vendors call?",status:"gap"},
    {id:"ps7",what:"Key moment filmer",who:"",when:"Assign by Oct",where:"Venue",notes:"Entrance, speeches, first dance",status:"gap"},
    {id:"ps8",what:"Card box security (sober)",who:"",when:"Assign by Oct",where:"Venue",notes:"Takes cash home",status:"gap"},
    {id:"ps9",what:"Pack-down crew (2-3)",who:"",when:"Assign by Oct",where:"Venue",notes:"Collect everything",status:"gap"},
    {id:"ps10",what:"Camcorder collector",who:"",when:"Assign by Oct",where:"Venue",notes:"Every camera, every table",status:"gap"},
  ]},
]

export const INITIAL_TASKS: Task[] = [
  {id:"t1",zone:"legal",task:"Lodge NOIM with priest",status:"not-started",owner:"",dep:"",notes:"Must be 1+ month before. Need original birth certs/passports.",phase:"mar",ord:0},
  {id:"t2",zone:"legal",task:"Gather original birth certs / passports",status:"not-started",owner:"",dep:"",notes:"Needed for NOIM.",phase:"mar",ord:1},
  {id:"t3",zone:"venue",task:"Check church wheelchair access for mum",status:"not-started",owner:"",dep:"",notes:"Mum is in wheelchair.",phase:"mar",ord:2},
  {id:"t4",zone:"ceremony",task:"One more meeting with priest",status:"not-started",owner:"Both",dep:"",notes:"NOIM, readings, music rules, accessibility, rehearsal.",phase:"mar",ord:3},
  {id:"t5",zone:"guests",task:"Chase ~50 non-RSVP guests",status:"not-started",owner:"Both",dep:"",notes:"Deadline passed Feb. ~50% haven't responded.",phase:"mar",ord:4},
  {id:"t6",zone:"vendors",task:"Formally ask Dom to MC",status:"not-started",owner:"",dep:"",notes:"He hasn't been asked yet!",phase:"mar",ord:5},
  {id:"t7",zone:"vendors",task:"Confirm speakers for DJ friend",status:"not-started",owner:"",dep:"",notes:"Family member might have them. Ask + test.",phase:"mar",ord:6},
  {id:"t8",zone:"venue",task:"Venue manager meeting",status:"not-started",owner:"Both",dep:"",notes:"Extra hour cost, setup, bar tab, draping, AV, pack-down.",phase:"mar",ord:7},
  {id:"t9",zone:"venue",task:"Check noise curfew",status:"not-started",owner:"",dep:"",notes:"Kingston Council. Mentone residential area.",phase:"mar",ord:8},
  {id:"t10",zone:"morning",task:"Figure out florist delivery logistics",status:"not-started",owner:"",dep:"",notes:"Bouquets to bride, buttonholes to groom (45 min away!), centrepieces to venue.",phase:"mar",ord:9},
  {id:"t11",zone:"vendors",task:"Finalise menu with caterer",status:"in-progress",owner:"",dep:"",notes:"$75/head, flexible. Second meeting needed.",phase:"apr",ord:0},
  {id:"t12",zone:"vendors",task:"Decide choir vs cheaper alternative",status:"needs-discussion",owner:"Both",dep:"",notes:"$1,600 quote.",phase:"apr",ord:1},
  {id:"t13",zone:"personal",task:"Buy groom suit + bow tie",status:"not-started",owner:"",dep:"",notes:"Clean black, bow tie.",phase:"apr",ord:2},
  {id:"t14",zone:"personal",task:"Buy wedding rings",status:"in-progress",owner:"Both",dep:"",notes:"Currently looking. 4-6 weeks.",phase:"apr",ord:3},
  {id:"t15",zone:"food",task:"Source affordable cake for 100",status:"not-started",owner:"Both",dep:"",notes:"Small cutting cake + sheet cakes.",phase:"apr",ord:4},
  {id:"t16",zone:"morning",task:"Decide bride getting-ready location",status:"needs-discussion",owner:"Both",dep:"",notes:"Home vs grandparents. Photo space.",phase:"apr",ord:5},
  {id:"t17",zone:"venue",task:"Decide 9pm vs 10pm",status:"needs-discussion",owner:"Both",dep:"t8",notes:"Leaning 10pm. Need cost.",phase:"apr",ord:6},
  {id:"t18",zone:"food",task:"Decide bar tab amount",status:"needs-discussion",owner:"Both",dep:"t8",notes:"$2-3k typical.",phase:"apr",ord:7},
  {id:"t19",zone:"venue",task:"Confirm draping situation",status:"not-started",owner:"",dep:"t8",notes:"Meeting venue manager.",phase:"apr",ord:8},
  {id:"t20",zone:"venue",task:"Check church petal policy",status:"not-started",owner:"",dep:"",notes:"For flower girl.",phase:"apr",ord:9},
  {id:"t21",zone:"personal",task:"Finalise bridesmaids dresses",status:"in-progress",owner:"",dep:"",notes:"Almost sorted.",phase:"apr",ord:10},
  {id:"t22",zone:"personal",task:"Ask ring bearer cousins + parents",status:"not-started",owner:"Both",dep:"",notes:"3 kid cousins.",phase:"apr",ord:11},
  {id:"t23",zone:"personal",task:"Ask flower girl cousin + parents",status:"not-started",owner:"Both",dep:"t20",notes:"Check petal policy first.",phase:"apr",ord:12},
  {id:"t24",zone:"design",task:"Finalise centrepiece design",status:"in-progress",owner:"Both",dep:"",notes:"Half designed.",phase:"apr",ord:13},
  {id:"t25",zone:"food",task:"Confirm canapes for cocktail hour",status:"not-started",owner:"",dep:"t11",notes:"Included or extra?",phase:"may",ord:0},
  {id:"t26",zone:"vendors",task:"Confirm caterer + venue staff",status:"not-started",owner:"",dep:"t8",notes:"Ask at venue meeting.",phase:"may",ord:1},
  {id:"t27",zone:"legal",task:"Confirm 2 witnesses",status:"not-started",owner:"",dep:"",notes:"Must be 18+.",phase:"may",ord:2},
  {id:"t28",zone:"legal",task:"Research wedding insurance",status:"not-started",owner:"",dep:"",notes:"~$200-500.",phase:"may",ord:3},
  {id:"t29",zone:"ceremony",task:"Choose readings",status:"not-started",owner:"Both",dep:"t4",notes:"2 readings + psalm + gospel.",phase:"may",ord:4},
  {id:"t30",zone:"ceremony",task:"Assign readers",status:"not-started",owner:"Both",dep:"t29",notes:"After readings picked.",phase:"jun",ord:0},
  {id:"t31",zone:"personal",task:"Coordinate groomsmen suit colour",status:"not-started",owner:"",dep:"t13",notes:"Send reference to all 4.",phase:"jun",ord:1},
  {id:"t32",zone:"ceremony",task:"Lock processional order + music",status:"not-started",owner:"Both",dep:"",notes:"Groom at front, bridesmaids, bride with grandfather.",phase:"jun",ord:2},
  {id:"t33",zone:"reception",task:"Create family photo shot list",status:"not-started",owner:"Both",dep:"",notes:"Must-have groupings.",phase:"jun",ord:3},
  {id:"t34",zone:"gap",task:"Create setup crew game plan",status:"not-started",owner:"",dep:"t8",notes:"2-3 friends at 2pm.",phase:"jun",ord:4},
  {id:"t35",zone:"gap",task:"Figure out how DIY stuff gets to venue",status:"not-started",owner:"",dep:"",notes:"Car transport by 2pm.",phase:"jun",ord:5},
  {id:"t36",zone:"gap",task:"Assign guest greeter for 4pm",status:"not-started",owner:"",dep:"",notes:"You arrive at 5pm.",phase:"jun",ord:6},
  {id:"t37",zone:"design",task:"Source battery candles",status:"not-started",owner:"",dep:"",notes:"No real candles.",phase:"jun",ord:7},
  {id:"t38",zone:"vendors",task:"Source camcorders + film cameras",status:"not-started",owner:"",dep:"",notes:"DIY video plan.",phase:"jul",ord:0},
  {id:"t39",zone:"vendors",task:"Build DJ playlist",status:"not-started",owner:"Both",dep:"",notes:"Must-plays + do-not-plays.",phase:"jul",ord:1},
  {id:"t40",zone:"ceremony",task:"Book church rehearsal",status:"not-started",owner:"",dep:"",notes:"Usually night before.",phase:"jul",ord:2},
  {id:"t41",zone:"guests",task:"Compile dietary requirements",status:"not-started",owner:"",dep:"t5",notes:"Export from WithJoy.",phase:"sep",ord:0},
  {id:"t42",zone:"guests",task:"Build seating plan",status:"not-started",owner:"Both",dep:"t5",notes:"After RSVPs finalised.",phase:"sep",ord:1},
  {id:"t43",zone:"design",task:"Design + print nameplates",status:"not-started",owner:"",dep:"t42",notes:"Need final names.",phase:"sep",ord:2},
  {id:"t44",zone:"design",task:"Design + print shared menus",status:"not-started",owner:"",dep:"t11",notes:"Need finalised menu.",phase:"sep",ord:3},
  {id:"t45",zone:"design",task:"Welcome sign",status:"not-started",owner:"",dep:"",notes:"DIY or order?",phase:"sep",ord:4},
  {id:"t46",zone:"design",task:"Plan bridal table styling",status:"not-started",owner:"Both",dep:"",notes:"Elevated vs others.",phase:"sep",ord:5},
  {id:"t47",zone:"reception",task:"Build day-of run sheet",status:"not-started",owner:"Both",dep:"t17",notes:"Dom + caterer + DJ need copies.",phase:"sep",ord:6},
  {id:"t48",zone:"reception",task:"Brief speakers on length + tone",status:"not-started",owner:"",dep:"",notes:"25 min total max.",phase:"sep",ord:7},
  {id:"t49",zone:"reception",task:"Plan grand entrance",status:"not-started",owner:"Both",dep:"",notes:"Music? Dom announces?",phase:"sep",ord:8},
  {id:"t50",zone:"reception",task:"Assign family wrangler",status:"not-started",owner:"",dep:"",notes:"For group photos.",phase:"sep",ord:9},
  {id:"t51",zone:"morning",task:"Map bride morning timeline",status:"not-started",owner:"",dep:"t16",notes:"Backwards from 10:45.",phase:"sep",ord:10},
  {id:"t52",zone:"morning",task:"Create bridesmaid morning plan",status:"not-started",owner:"",dep:"t51",notes:"Arrival time, dress.",phase:"sep",ord:11},
  {id:"t53",zone:"morning",task:"Map groom morning timeline",status:"not-started",owner:"",dep:"",notes:"Leave by 10:30.",phase:"sep",ord:12},
  {id:"t54",zone:"endofnight",task:"Assign card box security",status:"not-started",owner:"Both",dep:"",notes:"Sober person. Cash.",phase:"sep",ord:13},
  {id:"t55",zone:"endofnight",task:"Assign pack-down crew",status:"not-started",owner:"",dep:"",notes:"Everything collected.",phase:"sep",ord:14},
  {id:"t56",zone:"endofnight",task:"Plan send-off / exit",status:"not-started",owner:"Both",dep:"t8",notes:"Sparklers? Venue rules.",phase:"sep",ord:15},
  {id:"t57",zone:"gap",task:"Assign hotel check-in person",status:"not-started",owner:"",dep:"",notes:"Richmond hotel.",phase:"sep",ord:16},
  {id:"t58",zone:"endofnight",task:"Arrange transport to hotel",status:"not-started",owner:"",dep:"",notes:"Uber or pre-book.",phase:"sep",ord:17},
  {id:"t59",zone:"finalweek",task:"Reconfirm ALL vendors",status:"not-started",owner:"",dep:"",notes:"Date, time, contact.",phase:"week",ord:0},
  {id:"t60",zone:"finalweek",task:"Send final headcount to caterer",status:"not-started",owner:"",dep:"t5",notes:"Dietary, vendor meals.",phase:"week",ord:1},
  {id:"t61",zone:"finalweek",task:"Distribute run sheet",status:"not-started",owner:"",dep:"t47",notes:"Dom, caterer, DJ, bridal party.",phase:"week",ord:2},
  {id:"t62",zone:"finalweek",task:"Send photographer shot list",status:"not-started",owner:"",dep:"t33",notes:"Family groupings.",phase:"week",ord:3},
  {id:"t63",zone:"finalweek",task:"Pack ceremony + reception supplies",status:"not-started",owner:"",dep:"",notes:"Everything for church + venue.",phase:"week",ord:4},
  {id:"t64",zone:"finalweek",task:"Charge ALL camcorders",status:"not-started",owner:"",dep:"",notes:"Night before.",phase:"week",ord:5},
  {id:"t65",zone:"finalweek",task:"Prepare tip envelopes",status:"not-started",owner:"",dep:"",notes:"Cash, labelled.",phase:"week",ord:6},
  {id:"t66",zone:"finalweek",task:"Break in wedding shoes",status:"not-started",owner:"Both",dep:"",notes:"Few evenings.",phase:"week",ord:7},
  {id:"t67",zone:"finalweek",task:"Final grooming",status:"not-started",owner:"Both",dep:"",notes:"3-5 days before.",phase:"week",ord:8},
  {id:"t68",zone:"postwedding",task:"Lodge marriage cert with BDM",status:"not-started",owner:"",dep:"",notes:"First week.",phase:"after",ord:0},
  {id:"t69",zone:"postwedding",task:"Send thank you cards",status:"not-started",owner:"Both",dep:"",notes:"2-3 weeks.",phase:"after",ord:1},
  {id:"t70",zone:"postwedding",task:"Collect all video footage",status:"not-started",owner:"",dep:"",notes:"Camcorders, phones.",phase:"after",ord:2},
]

export const INITIAL_BUDGET: BudgetItem[] = [
  {id:"b1",cat:"Venue",amt:0,st:"deposited",n:"Deposit paid. Confirm total",g:"venue",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b2",cat:"Church",amt:0,st:"deposited",n:"Confirm total",g:"venue",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b3",cat:"Catering (~100)",amt:7500,st:"quoted",n:"~$75/head",g:"food",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b4",cat:"Florist",amt:1200,st:"deposited",n:"$500 of $1,200",g:"decor",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b5",cat:"Photographer",amt:0,st:"deposited",n:"Fill in total",g:"other",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b6",cat:"Makeup",amt:200,st:"deposited",n:"Trial upcoming",g:"bridal",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b7",cat:"Hair (friend)",amt:0,st:"quoted",n:"Confirm cost",g:"bridal",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b8",cat:"DJ (friend)",amt:0,st:"quoted",n:"$50/hr",g:"entertainment",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b9",cat:"Sprinter",amt:800,st:"deposited",n:"5hrs",g:"venue",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b10",cat:"Car hire",amt:330,st:"quoted",n:"3hrs",g:"venue",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b11",cat:"Wedding dress",amt:0,st:"paid",n:"Track cost",g:"bridal",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b12",cat:"Groom suit",amt:0,st:"quoted",n:"Black + bow tie",g:"bridal",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b13",cat:"Rings",amt:0,st:"quoted",n:"Looking",g:"bridal",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b14",cat:"Cake",amt:0,st:"quoted",n:"Not sourced",g:"food",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b15",cat:"Choir / music",amt:1600,st:"quoted",n:"Or cheaper",g:"entertainment",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b16",cat:"Bar tab",amt:0,st:"quoted",n:"Decide amount",g:"food",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b17",cat:"Extra hour",amt:0,st:"quoted",n:"Need cost",g:"venue",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b18",cat:"Draping",amt:0,st:"quoted",n:"TBD",g:"decor",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b19",cat:"Invitations",amt:0,st:"paid",n:"Sent",g:"decor",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b20",cat:"Stationery",amt:0,st:"quoted",n:"Nameplates, menus",g:"decor",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b21",cat:"Hotel night",amt:0,st:"deposited",n:"Richmond",g:"venue",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b22",cat:"Insurance",amt:0,st:"quoted",n:"Research",g:"venue",vendorName:"",vendorPhone:"",vendorEmail:""},
  {id:"b23",cat:"Misc",amt:0,st:"quoted",n:"Tips, emergency",g:"other",vendorName:"",vendorPhone:"",vendorEmail:""},
]

export const INITIAL_TIMELINE: TimelineEvent[] = [
  {id:"tl1",t:"7:30am",e:"Hair friend arrives",w:"Hair friend",view:"bride",locId:"bride"},
  {id:"tl2",t:"~9:00am",e:"Makeup artist arrives",w:"MUA",view:"bride",locId:"bride"},
  {id:"tl3",t:"~9:30am",e:"Bridesmaids arrive",w:"4 bridesmaids",view:"bride",locId:"bride"},
  {id:"tl4",t:"~9:30am",e:"Groomsmen getting ready",w:"Groom + 4",view:"groom",locId:"groom"},
  {id:"tl5",t:"~10:15am",e:"Morning photos",w:"Family cameras",view:"bride",locId:"bride"},
  {id:"tl6",t:"10:30am",e:"Groom + groomsmen leave",w:"45 min drive",view:"groom",locId:"groom"},
  {id:"tl7",t:"10:45am",e:"Sprinter picks up bride",w:"Sprinter",view:"bride",locId:"bride"},
  {id:"tl8",t:"11:15am",e:"Arrive at church",w:"Everyone",view:"both",locId:"church"},
  {id:"tl9",t:"11:30am",e:"Guests arrive + seated",w:"100 guests",view:"both",locId:"church"},
  {id:"tl10",t:"12:00pm",e:"Ceremony",w:"Catholic mass",big:true,view:"both",locId:"church"},
  {id:"tl11",t:"~1:00pm",e:"Family photos outside church",w:"Photographer",view:"both",locId:"church"},
  {id:"tl12",t:"~1:15pm",e:"Bride + groom depart",w:"$330 car",view:"both",locId:"church"},
  {id:"tl13",t:"~1:30pm",e:"Photos at Ripponlea",w:"~1 hour",view:"both",locId:"ripponlea"},
  {id:"tl14",t:"~2:30pm",e:"Photos done",w:"Chill time",view:"both",locId:"ripponlea"},
  {id:"tl15",t:"4:00pm",e:"Venue opens \u2014 cocktails",w:"Guests arrive",big:true,view:"both",locId:"venue"},
  {id:"tl16",t:"5:00pm",e:"Grand entrance",w:"Dom announces",big:true,view:"both",locId:"venue"},
  {id:"tl17",t:"5:30pm",e:"MC welcome",w:"Dom",view:"both",locId:"venue"},
  {id:"tl18",t:"6:00pm",e:"Dinner",w:"Sit-down",big:true,view:"both",locId:"venue"},
  {id:"tl19",t:"~7:15pm",e:"Speeches",w:"~25 min",big:true,view:"both",locId:"venue"},
  {id:"tl20",t:"~7:40pm",e:"First dance",w:"Custom song",big:true,view:"both",locId:"venue"},
  {id:"tl21",t:"~7:50pm",e:"Dance floor opens!",w:"DJ friend",big:true,view:"both",locId:"venue"},
  {id:"tl22",t:"~9:45pm",e:"Last song + send-off",w:"",view:"both",locId:"venue"},
  {id:"tl23",t:"10:00pm",e:"Venue closes",w:"",big:true,view:"both",locId:"venue"},
  {id:"tl24",t:"10:00pm",e:"Pack-down",w:"Crew TBD",view:"both",locId:"venue"},
  {id:"tl25",t:"~10:15pm",e:"Uber to hotel",w:"Richmond",view:"both",locId:"hotel"},
]

export const INITIAL_NOTES: Note[] = []
