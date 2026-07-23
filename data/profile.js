"use strict";

/* ============================================================
   PROFILE DATA — landing-page hero, contact links and the
   skills matrix. Rendered by assets/js/index.js.
   ============================================================ */

const PROFILE = {
  eyebrow: 'Software · Robotics · Real-time Systems',
  nameLines: ['Ashok Kumar', 'Chaudhary'],
  role: { prefix: 'Lead Software Engineer, ', company: 'General Autonomy' },
  bioHTML:
    'I build real-time software for autonomous ground and aerial robots, focusing on ' +
    'distributed systems, low-latency networking and full-stack tooling. ' +
    'Previously at RISA Labs, Testbook and Siemens. ' +
    '<b>B.Tech–M.Tech, IIT Kanpur.</b>',

  links: [
    { label: 'Resume',   href: 'Ashok_Resume_Software.pdf',           glyph: '↓', primary: true },
    { label: 'GitHub',   href: 'https://github.com/ashok281196',      glyph: '//',     me: true },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/ashok281196', glyph: 'in',     me: true },
    { label: 'Email',    href: 'mailto:ashok281196@gmail.com',        glyph: '@' }
  ],

  skills: [
    { label: 'Languages',           items: ['C++', 'Python', 'TypeScript', 'JavaScript', 'SQL'] },
    { label: 'Distributed Systems', items: ['ZeroMQ', 'gRPC', 'WebSockets', 'WebTransport'] },
    { label: 'Web & Full-Stack',    items: ['Next.js', 'Node.js', 'FastAPI', 'Three.js', 'Electron', 'MapLibre', 'LiveKit'] },
    { label: 'Databases',           items: ['Postgres', 'Redis', 'Firestore'] },
    { label: 'Cloud & Tools',       items: ['GCP', 'AWS', 'Docker', 'GStreamer', 'WebRTC', 'CI/CD'] }
  ]
};
