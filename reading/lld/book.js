"use strict";

/* ============================================================
   BOOK DATA - LLD: Zero to Hero. The chapter list drives the
   contents page, every chapter topbar and the prev/next
   navigation (rendered by book-ui.js), so adding a chapter
   here updates all navigation at once.
   ============================================================ */

const BOOK = {
  title: 'LLD: Zero to Hero',
  siteHref: '../../',
  siteLabel: 'ashok281196.github.io',
  badge: 'A Field Book · 2026',

  chapters: [
    {
      file: '01-tic-tac-toe.html',
      num: '01',
      title: 'Tic-Tac-Toe',
      navTitle: 'Ch. 1 · Tic-Tac-Toe',
      sub: 'O(1) win detection via signed running sums per row, column and diagonal, generalized past 3x3.',
      tag: 'Easy'
    },
    {
      file: '02-vending-machine.html',
      num: '02',
      title: 'Vending Machine',
      navTitle: 'Ch. 2 · Vending Machine',
      sub: 'The canonical State pattern: Idle, HasMoney and Dispensing, and a context that delegates every call.',
      tag: 'Easy'
    },
    {
      file: '03-snake-and-ladder.html',
      num: '03',
      title: 'Snake & Ladder',
      navTitle: 'Ch. 3 · Snake & Ladder',
      sub: 'Unifying snakes and ladders into one Jump concept, plus a pluggable Dice strategy.',
      tag: 'Easy'
    },
    {
      file: '04-atm-machine.html',
      num: '04',
      title: 'ATM Machine',
      navTitle: 'Ch. 4 · ATM Machine',
      sub: 'A session State machine wired to a Chain of Responsibility cash dispenser, largest note first.',
      tag: 'Easy'
    },
    {
      file: '05-logging-framework.html',
      num: '05',
      title: 'Logging Framework',
      navTitle: 'Ch. 5 · Logging Framework',
      sub: 'Pluggable sinks via Strategy and level filtering, plus an honest look at what production still needs.',
      tag: 'Easy'
    },
    {
      file: '06-parking-lot.html',
      num: '06',
      title: 'Parking Lot',
      navTitle: 'Ch. 6 · Parking Lot',
      sub: 'The single most-asked LLD question: multi-floor spots, tickets, fees, and where Strategy and a Factory belong.',
      tag: 'Medium'
    },
    {
      file: '07-elevator-system.html',
      num: '07',
      title: 'Elevator System',
      navTitle: 'Ch. 7 · Elevator System',
      sub: 'Per-car State machines, hall vs. cabin requests, and a pluggable SCAN dispatch strategy.',
      tag: 'Medium'
    },
    {
      file: '08-splitwise.html',
      num: '08',
      title: 'Splitwise',
      navTitle: 'Ch. 8 · Splitwise',
      sub: 'EQUAL, EXACT and PERCENT splits behind one Strategy, a pairwise balance sheet, and debt simplification.',
      tag: 'Medium'
    },
    {
      file: '09-lru-cache.html',
      num: '09',
      title: 'LRU Cache',
      navTitle: 'Ch. 9 · LRU Cache',
      sub: 'O(1) get/put via a hashmap plus doubly-linked list, with eviction policy left pluggable.',
      tag: 'Medium'
    },
    {
      file: '10-bookmyshow.html',
      num: '10',
      title: 'BookMyShow',
      navTitle: 'Ch. 10 · BookMyShow',
      sub: 'City to Theatre to Screen to Show to Seat, and the atomic seat-lock-with-timeout at the center of it.',
      tag: 'Medium'
    },
    {
      file: '11-chess.html',
      num: '11',
      title: 'Chess',
      navTitle: 'Ch. 11 · Chess',
      sub: 'Polymorphic per-piece move rules, check and checkmate detection, and undo/redo via Command.',
      tag: 'Hard'
    },
    {
      file: '12-ride-sharing.html',
      num: '12',
      title: 'Ride-Sharing',
      navTitle: 'Ch. 12 · Ride-Sharing',
      sub: 'Three state machines (rider, driver, trip), atomic matching, and pluggable surge pricing.',
      tag: 'Hard'
    },
    {
      file: '13-food-delivery.html',
      num: '13',
      title: 'Food Delivery',
      navTitle: 'Ch. 13 · Food Delivery',
      sub: 'One order lifecycle, three actors watching it, and a pluggable delivery-partner assignment strategy.',
      tag: 'Hard'
    },
    {
      file: '14-rate-limiter.html',
      num: '14',
      title: 'Rate Limiter',
      navTitle: 'Ch. 14 · Rate Limiter',
      sub: 'Token Bucket, Leaky Bucket, Fixed Window and Sliding Window behind one Strategy and a Factory.',
      tag: 'Hard'
    },
    {
      file: '15-message-queue-pubsub.html',
      num: '15',
      title: 'Message Queue / Pub-Sub',
      navTitle: 'Ch. 15 · Message Queue / Pub-Sub',
      sub: 'A mini-Kafka in memory: topics, broadcast vs. consumer groups, per-consumer offsets, backpressure.',
      tag: 'Hard'
    }
  ]
};
