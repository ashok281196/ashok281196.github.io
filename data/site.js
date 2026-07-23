"use strict";

/* ============================================================
   SITE DATA — identity, navigation and the page index.
   Everything site-wide and editorial lives here, not in HTML.
   Add a new page by appending to SITE.pages.
   ============================================================ */

const SITE = {
  host: 'ashok281196.github.io',
  location: 'Bengaluru, India · UTC+05:30',
  owner: 'Ashok Kumar Chaudhary',
  copyrightYear: 2026,
  sourceUrl: 'https://github.com/ashok281196/ashok281196.github.io',
  tagline: 'Plain HTML, zero frameworks',

  pages: [
    {
      file: 'India-2026-27-season.html',
      title: 'India Men’s Season 2026–27',
      desc: 'Team India’s full fixture book — eight tours, five countries, forty-seven matches, every ground named. Ticket-stub schedule with format filters.',
      meta: [
        { label: 'LIVE', hot: true },
        { label: 'cricket' },
        { label: '8 tours · 47 matches' },
        { label: 'updated Jul 2026' }
      ]
    }
  ],

  indexSlot: 'more pages soon — this index grows one file at a time'
};
