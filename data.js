/* =====================================================================
   Timeline + gallery-category data for Gabrielle & Kris. Exposed as
   window.WED. Venues themselves are family-editable and live in
   Supabase (see WedStore.getVenues()) — there's no static venues array
   here anymore.
   ===================================================================== */
window.WED = {
  couple: "Gabrielle & Kris",
  window: "August – December 2028",

  timeline: [
    { n:"Phase 01", title:"Dreaming & Exploring", when:"Now – Summer 2026", color:"var(--sky)", key:true,
      items:["Local or destination?","What kind of experience excites us?","Big party or small & cozy?","What atmosphere feels like *us*?"] },
    { n:"Phase 02", title:"Choosing the Destination", when:"Fall 2026 – Summer 2027", color:"var(--orchid)",
      items:["Pick the destination","Pick the venue","Rough guest-count range","Preferred wedding season"] },
    { n:"Phase 03", title:"Building the Wedding", when:"Late 2027", color:"var(--sea)",
      items:["Wedding party","Travel plans","Guest communication","Photographer & decor direction"] },
    { n:"Phase 04", title:"Final Details", when:"Early 2028", color:"var(--palm)",
      items:["Final guest count","Logistics & timeline","Reception details","Last little touches"] },
    { n:"Phase 05", title:"Wedding Time!", when:"Aug – Dec 2028", color:"var(--coral)",
      items:["Show up","Marry your person","Dance till late","Celebrate 🎉"] },
  ],

  galleryCats: [
    { key:"arrival",   gn:"Gallery 01", title:"Arrival & First Impressions", q:"What does it feel like when guests arrive?" },
    { key:"ceremony",  gn:"Gallery 02", title:"Ceremony Inspiration",        q:"What does the ceremony feel like?" },
    { key:"reception", gn:"Gallery 03", title:"Reception Inspiration",       q:"What does the celebration feel like?" },
    { key:"guest",     gn:"Gallery 04", title:"Guest Experience",            q:"What does the whole weekend feel like?" },
    { key:"area",      gn:"Gallery 05", title:"The Surrounding Area",        q:"What's the broader destination like?" },
    { key:"signature", gn:"Gallery 06", title:"Signature Moments",           q:"What makes this place unmistakably itself?" },
  ],

};
