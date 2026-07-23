"use strict";

/* ============================================================
   SEASON DATA — India men's 2026-27 fixture book.
   SEASON holds the hero copy and footer notes; TOURS holds
   every tour and match. Rendered by assets/js/season.js
   (hero stats — tours / matches / Tests / grounds — are
   computed from TOURS, never hand-counted).
   ============================================================ */

const SEASON = {
  eyebrow: 'Team India · Senior Men · Fixture Book',
  titleHTML: 'Season <em>2026–27</em>',
  sub: 'July in England to the Border-Gavaskar finale in Ahmedabad next March — every ticket below names the ground.',
  stubLabel: 'Admit All',
  ticketNo: '№ IND-26/27',
  footerHTML:
    'Home fixtures per BCCI’s official 2026-27 season announcement · Away tours per ECB, Zimbabwe Cricket, SLC and NZC · Fixtures subject to change.<br>' +
    'India’s men also defend Asian Games gold in Aichi-Nagoya, Japan (Sep 19 – Oct 4, 2026); that draw is announced separately. ' +
    'Home-venue stadiums shown are each city’s international ground.'
};

const TOURS = [
  {
    id:'eng', title:'Tour of England', opponent:'England', oppFlag:'\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
    home:false, country:'England & Wales', dates:'Jul 1 – 19, 2026', month:'JUL',
    status:'Completed', tag:'White-ball tour', fmtCounts:'5 T20I · 3 ODI', fmtList:['T20I','ODI'], open:false,
    insight:'<b>England swept the T20Is 4-0 and took the ODIs 2-1.</b> Shubman Gill debuted as ODI captain; the Lord’s finale on Jul 19 closed the tour.',
    matches:[
      {num:'1st T20I',format:'T20I',dow:'Wed',dd:'01',mm:'Jul',time:'10:00 PM IST',stadium:'Riverside Ground',city:'Chester-le-Street',country:'England',done:true,note:'5:30 PM local · day-night'},
      {num:'2nd T20I',format:'T20I',dow:'Sat',dd:'04',mm:'Jul',time:'7:00 PM IST',stadium:'Old Trafford',city:'Manchester',country:'England',done:true,note:'2:30 PM local'},
      {num:'3rd T20I',format:'T20I',dow:'Tue',dd:'07',mm:'Jul',time:'10:00 PM IST',stadium:'Trent Bridge',city:'Nottingham',country:'England',done:true,note:''},
      {num:'4th T20I',format:'T20I',dow:'Thu',dd:'09',mm:'Jul',time:'10:00 PM IST',stadium:'County Ground',city:'Bristol',country:'England',done:true,note:''},
      {num:'5th T20I',format:'T20I',dow:'Sat',dd:'11',mm:'Jul',time:'7:00 PM IST',stadium:'Utilita Bowl',city:'Southampton',country:'England',done:true,note:''},
      {num:'1st ODI',format:'ODI',dow:'Tue',dd:'14',mm:'Jul',time:'Day-night',stadium:'Edgbaston',city:'Birmingham',country:'England',done:true,note:'Gill’s first ODI as captain'},
      {num:'2nd ODI',format:'ODI',dow:'Thu',dd:'16',mm:'Jul',time:'Day-night',stadium:'Sophia Gardens',city:'Cardiff',country:'Wales',done:true,note:'Only fixture in Wales'},
      {num:'3rd ODI',format:'ODI',dow:'Sun',dd:'19',mm:'Jul',time:'Series finale',stadium:'Lord’s',city:'London',country:'England',done:true,note:'Home of Cricket'}
    ]
  },
  {
    id:'zimaway', title:'Tour of Zimbabwe', opponent:'Zimbabwe', oppFlag:'\u{1F1FF}\u{1F1FC}',
    home:false, country:'Zimbabwe', dates:'Jul 23 – 26, 2026', month:'JUL',
    status:'Starting Soon', tag:'Shreyas Iyer captains', fmtCounts:'3 T20I', fmtList:['T20I'], open:true,
    insight:'All three T20Is at <b>Harare Sports Club</b>. A young side led by Shreyas Iyer (Tilak Varma vice-captain) rebuilds after T20I series defeats to Ireland and England. VVS Laxman is stand-in head coach.',
    matches:[
      {num:'1st T20I',format:'T20I',dow:'Thu',dd:'23',mm:'Jul',time:'4:30 PM IST',stadium:'Harare Sports Club',city:'Harare',country:'Zimbabwe',done:false,note:'1:00 PM local'},
      {num:'2nd T20I',format:'T20I',dow:'Sat',dd:'25',mm:'Jul',time:'4:30 PM IST',stadium:'Harare Sports Club',city:'Harare',country:'Zimbabwe',done:false,note:''},
      {num:'3rd T20I',format:'T20I',dow:'Sun',dd:'26',mm:'Jul',time:'4:30 PM IST',stadium:'Harare Sports Club',city:'Harare',country:'Zimbabwe',done:false,note:'Back-to-back with 2nd T20I'}
    ]
  },
  {
    id:'slaway', title:'Tour of Sri Lanka', opponent:'Sri Lanka', oppFlag:'\u{1F1F1}\u{1F1F0}',
    home:false, country:'Sri Lanka', dates:'Aug 15 – 27, 2026', month:'AUG',
    status:'Upcoming', tag:'WTC 2025-27', fmtCounts:'2 Tests', fmtList:['TEST'], open:true,
    insight:'Both Tests count toward the <b>WTC 2025-27 cycle</b> — India sit 5th (48.15 PCT), Sri Lanka 6th. First Test tour of the island since the 3-0 sweep in 2017; spin-friendly surfaces expected.',
    matches:[
      {num:'1st Test',format:'TEST',dow:'Sat',rng:'15–19',mm:'Aug',time:'10:00 AM',stadium:'Galle International Cricket Stadium',city:'Galle',country:'Sri Lanka',done:false,note:'Series opener by the fort'},
      {num:'2nd Test',format:'TEST',dow:'Sun',rng:'23–27',mm:'Aug',time:'10:00 AM',stadium:'Sinhalese Sports Club',city:'Colombo',country:'Sri Lanka',done:false,note:'Decider at the SSC'}
    ]
  },
  {
    id:'wi', title:'West Indies in India', opponent:'West Indies', oppFlag:'\u{1F334}',
    home:true, country:'India', dates:'Sep 27 – Oct 17, 2026', month:'SEP',
    status:'Upcoming', tag:'Home season opener', fmtCounts:'3 ODI · 5 T20I', fmtList:['ODI','T20I'], open:true,
    insight:'India’s <b>2026-27 home international season begins here</b> — the first of 22 home matches across 17 cities announced by the BCCI.',
    matches:[
      {num:'1st ODI',format:'ODI',dow:'Sun',dd:'27',mm:'Sep',time:'2:00 PM IST',stadium:'Greenfield International Stadium',city:'Trivandrum',country:'India',done:false,note:'Kerala'},
      {num:'2nd ODI',format:'ODI',dow:'Wed',dd:'30',mm:'Sep',time:'2:00 PM IST',stadium:'ACA Stadium, Barsapara',city:'Guwahati',country:'India',done:false,note:'Assam'},
      {num:'3rd ODI',format:'ODI',dow:'Sat',dd:'03',mm:'Oct',time:'2:00 PM IST',stadium:'Maharaja Yadavindra Singh Stadium, Mullanpur',city:'New Chandigarh',country:'India',done:false,note:'Punjab'},
      {num:'1st T20I',format:'T20I',dow:'Tue',dd:'06',mm:'Oct',time:'7:00 PM IST',stadium:'Ekana Cricket Stadium',city:'Lucknow',country:'India',done:false,note:'Uttar Pradesh'},
      {num:'2nd T20I',format:'T20I',dow:'Fri',dd:'09',mm:'Oct',time:'7:00 PM IST',stadium:'JSCA International Stadium',city:'Ranchi',country:'India',done:false,note:'Jharkhand'},
      {num:'3rd T20I',format:'T20I',dow:'Sun',dd:'11',mm:'Oct',time:'7:00 PM IST',stadium:'Holkar Cricket Stadium',city:'Indore',country:'India',done:false,note:'Madhya Pradesh'},
      {num:'4th T20I',format:'T20I',dow:'Wed',dd:'14',mm:'Oct',time:'7:00 PM IST',stadium:'Rajiv Gandhi International Stadium',city:'Hyderabad',country:'India',done:false,note:'Telangana'},
      {num:'5th T20I',format:'T20I',dow:'Sat',dd:'17',mm:'Oct',time:'7:00 PM IST',stadium:'M. Chinnaswamy Stadium',city:'Bengaluru',country:'India',done:false,note:'Karnataka'}
    ]
  },
  {
    id:'nz', title:'Tour of New Zealand', opponent:'New Zealand', oppFlag:'\u{1F1F3}\u{1F1FF}',
    home:false, country:'New Zealand', dates:'Oct 22 – Dec 1, 2026', month:'OCT',
    status:'Upcoming', tag:'Largest inbound tour in NZ history', fmtCounts:'5 T20I · 5 ODI · 2 Tests', fmtList:['T20I','ODI','TEST'], open:true,
    insight:'Only India’s <b>third all-format tour of New Zealand</b> (after 2008-09 and 2019-20). A T20 World Cup final rematch, a 5-ODI audition for the 2027 World Cup, then two WTC Tests.',
    matches:[
      {num:'1st T20I',format:'T20I',dow:'Thu',dd:'22',mm:'Oct',time:'1:30 PM IST',stadium:'Hagley Oval',city:'Christchurch',country:'New Zealand',done:false,note:''},
      {num:'2nd T20I',format:'T20I',dow:'Sat',dd:'24',mm:'Oct',time:'1:30 PM IST',stadium:'Hagley Oval',city:'Christchurch',country:'New Zealand',done:false,note:''},
      {num:'3rd T20I',format:'T20I',dow:'Tue',dd:'27',mm:'Oct',time:'1:30 PM IST',stadium:'HNRY Stadium',city:'Wellington',country:'New Zealand',done:false,note:''},
      {num:'4th T20I',format:'T20I',dow:'Fri',dd:'30',mm:'Oct',time:'1:30 PM IST',stadium:'Eden Park',city:'Auckland',country:'New Zealand',done:false,note:''},
      {num:'5th T20I',format:'T20I',dow:'Sun',dd:'01',mm:'Nov',time:'1:30 PM IST',stadium:'Seddon Park',city:'Hamilton',country:'New Zealand',done:false,note:''},
      {num:'1st ODI',format:'ODI',dow:'Wed',dd:'04',mm:'Nov',time:'8:30 AM IST',stadium:'Eden Park',city:'Auckland',country:'New Zealand',done:false,note:'Day-night'},
      {num:'2nd ODI',format:'ODI',dow:'Sat',dd:'07',mm:'Nov',time:'8:30 AM IST',stadium:'HNRY Stadium',city:'Wellington',country:'New Zealand',done:false,note:'Day-night'},
      {num:'3rd ODI',format:'ODI',dow:'Tue',dd:'10',mm:'Nov',time:'8:30 AM IST',stadium:'Seddon Park',city:'Hamilton',country:'New Zealand',done:false,note:'Day-night'},
      {num:'4th ODI',format:'ODI',dow:'Fri',dd:'13',mm:'Nov',time:'8:30 AM IST',stadium:'Bay Oval',city:'Mount Maunganui',country:'New Zealand',done:false,note:'Day-night'},
      {num:'5th ODI',format:'ODI',dow:'Sun',dd:'15',mm:'Nov',time:'8:30 AM IST',stadium:'Bay Oval',city:'Mount Maunganui',country:'New Zealand',done:false,note:'Day-night'},
      {num:'1st Test',format:'TEST',dow:'Thu',rng:'19–23',mm:'Nov',time:'3:30 AM IST',stadium:'Basin Reserve',city:'Wellington',country:'New Zealand',done:false,note:'WTC 2025-27'},
      {num:'2nd Test',format:'TEST',dow:'Fri',rng:'27–1',mm:'Nov-Dec',time:'3:30 AM IST',stadium:'Hagley Oval',city:'Christchurch',country:'New Zealand',done:false,note:'WTC 2025-27'}
    ]
  },
  {
    id:'slhome', title:'Sri Lanka in India', opponent:'Sri Lanka', oppFlag:'\u{1F1F1}\u{1F1F0}',
    home:true, country:'India', dates:'Dec 13 – 27, 2026', month:'DEC',
    status:'Upcoming', tag:'Year-end white-ball series', fmtCounts:'3 ODI · 3 T20I', fmtList:['ODI','T20I'], open:true,
    insight:'A December white-ball assignment doubling as <b>ODI World Cup 2027 preparation</b>, closing India’s 2026 calendar with a Pune T20I on Dec 27.',
    matches:[
      {num:'1st ODI',format:'ODI',dow:'Sun',dd:'13',mm:'Dec',time:'2:00 PM IST',stadium:'Arun Jaitley Stadium',city:'Delhi',country:'India',done:false,note:'Day-night'},
      {num:'2nd ODI',format:'ODI',dow:'Wed',dd:'16',mm:'Dec',time:'2:00 PM IST',stadium:'M. Chinnaswamy Stadium',city:'Bengaluru',country:'India',done:false,note:'Day-night'},
      {num:'3rd ODI',format:'ODI',dow:'Sat',dd:'19',mm:'Dec',time:'2:00 PM IST',stadium:'Narendra Modi Stadium',city:'Ahmedabad',country:'India',done:false,note:'Day-night'},
      {num:'1st T20I',format:'T20I',dow:'Tue',dd:'22',mm:'Dec',time:'7:00 PM IST',stadium:'Niranjan Shah Stadium',city:'Rajkot',country:'India',done:false,note:'Gujarat'},
      {num:'2nd T20I',format:'T20I',dow:'Thu',dd:'24',mm:'Dec',time:'7:00 PM IST',stadium:'Barabati Stadium',city:'Cuttack',country:'India',done:false,note:'Odisha'},
      {num:'3rd T20I',format:'T20I',dow:'Sun',dd:'27',mm:'Dec',time:'7:00 PM IST',stadium:'MCA Stadium, Gahunje',city:'Pune',country:'India',done:false,note:'Maharashtra'}
    ]
  },
  {
    id:'zimhome', title:'Zimbabwe in India', opponent:'Zimbabwe', oppFlag:'\u{1F1FF}\u{1F1FC}',
    home:true, country:'India', dates:'Jan 3 – 9, 2027', month:'JAN',
    status:'Upcoming', tag:'New year ODIs', fmtCounts:'3 ODI', fmtList:['ODI'], open:true,
    insight:'Zimbabwe’s <b>first bilateral tour of India in over a decade</b> — three afternoon ODIs at three iconic grounds, feeding straight into World Cup 2027 planning.',
    matches:[
      {num:'1st ODI',format:'ODI',dow:'Sun',dd:'03',mm:'Jan',time:'2:00 PM IST',stadium:'Eden Gardens',city:'Kolkata',country:'India',done:false,note:'West Bengal'},
      {num:'2nd ODI',format:'ODI',dow:'Wed',dd:'06',mm:'Jan',time:'2:00 PM IST',stadium:'Rajiv Gandhi International Stadium',city:'Hyderabad',country:'India',done:false,note:'Telangana'},
      {num:'3rd ODI',format:'ODI',dow:'Sat',dd:'09',mm:'Jan',time:'2:00 PM IST',stadium:'Wankhede Stadium',city:'Mumbai',country:'India',done:false,note:'Maharashtra'}
    ]
  },
  {
    id:'aus', title:'Border-Gavaskar Trophy', opponent:'Australia', oppFlag:'\u{1F1E6}\u{1F1FA}',
    home:true, country:'India', dates:'Jan 21 – Mar 3, 2027', month:'JAN',
    status:'Upcoming', tag:'Season showpiece · WTC 2025-27', fmtCounts:'5 Tests', fmtList:['TEST'], open:true,
    insight:'The marquee series of the season — a full <b>five-Test Border-Gavaskar Trophy at home</b>, likely decisive for India’s WTC final hopes. Guwahati hosts a BGT Test for the first time.',
    matches:[
      {num:'1st Test',format:'TEST',dow:'Thu',rng:'21–25',mm:'Jan',time:'9:30 AM IST',stadium:'VCA Stadium, Jamtha',city:'Nagpur',country:'India',done:false,note:'Maharashtra'},
      {num:'2nd Test',format:'TEST',dow:'Fri',rng:'29–2',mm:'Jan-Feb',time:'9:30 AM IST',stadium:'MA Chidambaram Stadium (Chepauk)',city:'Chennai',country:'India',done:false,note:'Tamil Nadu'},
      {num:'3rd Test',format:'TEST',dow:'Thu',rng:'11–15',mm:'Feb',time:'9:00 AM IST',stadium:'ACA Stadium, Barsapara',city:'Guwahati',country:'India',done:false,note:'Assam · earlier start'},
      {num:'4th Test',format:'TEST',dow:'Fri',rng:'19–23',mm:'Feb',time:'9:30 AM IST',stadium:'JSCA International Stadium',city:'Ranchi',country:'India',done:false,note:'Jharkhand'},
      {num:'5th Test',format:'TEST',dow:'Sat',rng:'27–3',mm:'Feb-Mar',time:'9:30 AM IST',stadium:'Narendra Modi Stadium',city:'Ahmedabad',country:'India',done:false,note:'Gujarat · series finale'}
    ]
  }
];
