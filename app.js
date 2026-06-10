/* =====================================================================
   Shared interactions: favorites, notes, board pins, mood filter, nav.
   Plain vanilla JS. State lives in Supabase (window.WedStore) and is
   shared by the whole family — sign-in (window.WedAuth) is required to
   write changes.
   ===================================================================== */
(function(){
  "use strict";

  /* ---------- wait for the auth/data modules to be ready ---------- */
  function waitFor(check, timeout, interval){
    timeout = timeout || 5000; interval = interval || 50;
    return new Promise((resolve)=>{
      const start = Date.now();
      (function poll(){
        const v = check();
        if(v) return resolve(v);
        if(Date.now()-start >= timeout) return resolve(null);
        setTimeout(poll, interval);
      })();
    });
  }

  /* ---------- toast ---------- */
  let toastWrap;
  function toast(msg, em){
    if(!toastWrap){ toastWrap=document.createElement('div'); toastWrap.className='toast-wrap'; document.body.appendChild(toastWrap); }
    const t=document.createElement('div'); t.className='toast';
    t.innerHTML=(em?`<span class="em">${em}</span>`:'')+`<span>${msg}</span>`;
    toastWrap.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),350); }, 2400);
  }
  window.wedToast = toast;

  /* ---------- require sign-in for write actions ---------- */
  function requireSignIn(msg){
    const auth = window.WedAuth;
    if(auth && auth.isSignedIn()) return true;
    toast(msg || 'Sign in to make changes', '\u{1F510}');
    if(auth) auth.signIn();
    return false;
  }

  /* ---------- nav ---------- */
  async function initNav(){
    const toggle=document.querySelector('.nav-toggle');
    const links=document.querySelector('.nav-links');
    if(toggle&&links){ toggle.addEventListener('click',()=>links.classList.toggle('open')); }
    await refreshPinCount();
  }

  async function refreshPinCount(){
    const cnt=document.querySelector('.nav-board .cnt');
    if(!cnt) return;
    const store = await waitFor(()=>window.WedStore);
    if(!store) return;
    const pins = await store.getPins();
    cnt.textContent = pins.length;
  }

  /* ---------- favorite buttons ---------- */
  async function initFaves(){
    const groups={};
    document.querySelectorAll('.fave[data-venue][data-state]').forEach(b=>{
      const v=b.dataset.venue; (groups[v]=groups[v]||[]).push(b);
    });
    if(!Object.keys(groups).length) return;

    const store = await waitFor(()=>window.WedStore);
    if(!store) return;
    const favorites = await store.getFavorites();

    Object.keys(groups).forEach(v=>{
      let cur = favorites[v] || null;
      const paint=()=>groups[v].forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.state===cur)));
      paint();
      groups[v].forEach(b=>{
        b.addEventListener('click', async ()=>{
          if(!requireSignIn('Sign in to vote on venues')) return;
          const next = cur===b.dataset.state ? null : b.dataset.state;
          try{
            await store.setFavorite(v, next);
            cur = next;
            paint();
            if(next){
              const m={love:['Love it!','❤️'],maybe:['Filed under maybe','\u{1F914}'],info:['Noted — need more info','\u{1F50D}']}[next];
              toast(m[0],m[1]);
            }
          }catch(e){ toast('Could not save — try again',''); }
        });
      });
    });
  }

  /* ---------- notes ---------- */
  async function initNotes(){
    const areas = document.querySelectorAll('textarea[data-note-venue]');
    if(!areas.length) return;
    const store = await waitFor(()=>window.WedStore);
    if(!store) return;

    areas.forEach(async (ta)=>{
      const v=ta.dataset.noteVenue;
      const saved=document.querySelector(`[data-note-saved="${v}"]`);
      ta.value = await store.getNote(v);
      let t, debounce;
      ta.addEventListener('input',()=>{
        if(!requireSignIn('Sign in to add notes')){ return; }
        clearTimeout(debounce);
        debounce=setTimeout(async ()=>{
          try{
            await store.setNote(v, ta.value);
            if(saved){ saved.textContent="Saved ✓"; clearTimeout(t); t=setTimeout(()=>saved.textContent="",1400); }
          }catch(e){ toast('Could not save note',''); }
        }, 500);
      });
    });
  }

  /* ---------- pin buttons (gallery) ---------- */
  async function initPinButtons(){
    const buttons = document.querySelectorAll('.pinbtn[data-pin-id]');
    if(!buttons.length) return;
    const store = await waitFor(()=>window.WedStore);
    if(!store) return;
    let pins = await store.getPins();
    const isPinned=(id)=>pins.some(p=>p.id===id);

    buttons.forEach(b=>{
      const id=b.dataset.pinId;
      if(isPinned(id)){ b.classList.add('pinned'); b.innerHTML='❤'; }
      b.addEventListener('click', async ()=>{
        if(!requireSignIn('Sign in to pin photos')) return;
        const on = isPinned(id);
        try{
          if(on){
            await store.removePin(id);
            pins = pins.filter(p=>p.id!==id);
          } else {
            const rec={id, venue:b.dataset.venue, venueName:b.dataset.venueName, cat:b.dataset.cat, caption:b.dataset.caption};
            await store.addPin(rec);
            pins.push(rec);
          }
          b.classList.toggle('pinned', !on);
          b.innerHTML = !on?'❤':'♡';
          toast(!on?'Pinned to your board':'Removed from board', !on?'\u{1F4CC}':'');
          const cnt=document.querySelector('.nav-board .cnt'); if(cnt) cnt.textContent=pins.length;
        }catch(e){ toast('Could not save — try again',''); }
      });
    });
  }

  /* ---------- mood filter (showdown) ---------- */
  function initMoodFilter(){
    const chips=document.querySelectorAll('[data-mood-chip]');
    if(!chips.length) return;
    chips.forEach(c=>c.addEventListener('click',()=>{
      const mood=c.dataset.moodChip;
      chips.forEach(x=>x.setAttribute('aria-pressed',String(x===c)));
      document.querySelectorAll('[data-row-moods]').forEach(row=>{
        const moods=(row.dataset.rowMoods||'').split('|');
        const show = mood==='all' || moods.includes(mood);
        row.style.display = show?'':'none';
      });
    }));
  }

  /* ---------- preserve preview auth token across internal links ---------- */
  /* In preview, the access token lives in location.search; relative links drop
     it and 404. Re-point internal .html links to carry the current query.
     No-ops on download/export (location.search is empty there). */
  function patchLinks(){
    const q=location.search;
    if(!q) return;
    document.querySelectorAll('a[href]').forEach(a=>{
      const href=a.getAttribute('href');
      if(!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return;
      const hashIdx=href.indexOf('#');
      const path = hashIdx>=0 ? href.slice(0,hashIdx) : href;
      const hash = hashIdx>=0 ? href.slice(hashIdx) : '';
      if(/\.html$/i.test(path)){ a.setAttribute('href', path+q+hash); }
    });
  }

  /* ---------- "Save photos to your repo" folder connector ---------- */
  /* Uses the File System Access API (window.ImageSlotFS, exposed by
     image-slot.js). When connected, dropped/replaced photos are written as
     real files into the repo's images/ folder + manifest.json — commit & push
     and they're live for everyone. No bake step. */
  function initFolderBar(){
    const FS = window.ImageSlotFS;
    if(!FS) return;
    const bar=document.createElement('div'); bar.className='fsbar';
    document.body.appendChild(bar);
    const render=()=>{
      if(!FS.supported){
        bar.className='fsbar warn';
        bar.innerHTML='<span class="ic">&#9888;</span><span>To save photos into your repo, open this site in <strong>Chrome</strong> or <strong>Edge</strong>. (Photos you drop still show on this device.)</span><button class="x" aria-label="Dismiss">&times;</button>';
      } else if(FS.isReady()){
        bar.className='fsbar ok';
        bar.innerHTML='<span class="ic">&#10003;</span><span>Saving photos to <strong>'+(FS.folderName()||'your folder')+'/images</strong>. Commit &amp; push to share.</span><button class="x" aria-label="Dismiss">&times;</button>';
      } else {
        bar.className='fsbar';
        bar.innerHTML='<span class="ic">&#128193;</span><span>Connect your repo folder so dropped photos save as real files (shareable via GitHub).</span><button class="connect">Connect folder</button><button class="x" aria-label="Dismiss">&times;</button>';
      }
      const c=bar.querySelector('.connect');
      if(c) c.addEventListener('click',async()=>{
        c.disabled=true; c.textContent='Connecting…';
        try{ const name=await FS.connect(); if(window.wedToast) window.wedToast('Connected — saving to '+name+'/images','\u{1F4C1}'); }
        catch(e){ if(window.wedToast) window.wedToast(e&&e.message==='not-supported'?'Use Chrome or Edge to save into the folder':'Folder not connected',''); c.disabled=false; c.textContent='Connect folder'; }
      });
      const x=bar.querySelector('.x');
      if(x) x.addEventListener('click',()=>{ bar.remove(); });
    };
    render();
    FS.onChange(render);
  }

  // Re-runnable wiring for dynamically-rendered content (venue grid, venue
  // page, showdown rows are built async from Supabase, after
  // DOMContentLoaded has already fired).
  window.WedApp = {
    waitFor, toast, requireSignIn,
    initFaves, initNotes, initPinButtons, initMoodFilter, refreshPinCount,
  };

  document.addEventListener('DOMContentLoaded',()=>{
    patchLinks(); initNav(); initFaves(); initNotes(); initPinButtons(); initMoodFilter(); initFolderBar();
  });
})();
