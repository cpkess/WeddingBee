/* =====================================================================
   Shared interactions: favorites, notes, board pins, mood filter, nav.
   Plain vanilla JS. State in localStorage so it persists across pages.
   ===================================================================== */
(function(){
  "use strict";
  const LS = {
    fav:  (v)=>"wed:fav:"+v,
    note: (v)=>"wed:note:"+v,
    pins: "wed:pins",
  };
  const get = (k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v);}catch(e){return d;} };
  const set = (k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };

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

  /* ---------- pins ---------- */
  function getPins(){ return get(LS.pins, []); }
  function isPinned(id){ return getPins().some(p=>p.id===id); }
  function togglePin(rec){
    let pins=getPins();
    const i=pins.findIndex(p=>p.id===rec.id);
    if(i>=0){ pins.splice(i,1); set(LS.pins,pins); return false; }
    pins.push(rec); set(LS.pins,pins); return true;
  }
  window.wedPins = { get:getPins, isPinned, toggle:togglePin };

  /* ---------- nav ---------- */
  function initNav(){
    const cnt=document.querySelector('.nav-board .cnt');
    if(cnt) cnt.textContent = getPins().length;
    const toggle=document.querySelector('.nav-toggle');
    const links=document.querySelector('.nav-links');
    if(toggle&&links){ toggle.addEventListener('click',()=>links.classList.toggle('open')); }
  }

  /* ---------- favorite buttons ---------- */
  function initFaves(){
    const groups={};
    document.querySelectorAll('.fave[data-venue][data-state]').forEach(b=>{
      const v=b.dataset.venue; (groups[v]=groups[v]||[]).push(b);
    });
    Object.keys(groups).forEach(v=>{
      const cur=get(LS.fav(v),null);
      groups[v].forEach(b=>{
        b.setAttribute('aria-pressed', String(b.dataset.state===cur));
        b.addEventListener('click',()=>{
          const now=get(LS.fav(v),null);
          const next = now===b.dataset.state ? null : b.dataset.state;
          set(LS.fav(v),next);
          groups[v].forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.state===next)));
          if(next){
            const m={love:['Love it!','\u2764\uFE0F'],maybe:['Filed under maybe','\u{1F914}'],info:['Noted \u2014 need more info','\u{1F50D}']}[next];
            toast(m[0],m[1]);
          }
        });
      });
    });
  }

  /* ---------- notes ---------- */
  function initNotes(){
    document.querySelectorAll('textarea[data-note-venue]').forEach(ta=>{
      const v=ta.dataset.noteVenue;
      ta.value=get(LS.note(v),"")||"";
      const saved=document.querySelector(`[data-note-saved="${v}"]`);
      let t;
      ta.addEventListener('input',()=>{
        set(LS.note(v),ta.value);
        if(saved){ saved.textContent="Saved \u2713"; clearTimeout(t); t=setTimeout(()=>saved.textContent="",1400); }
      });
    });
  }

  /* ---------- pin buttons (gallery) ---------- */
  function initPinButtons(){
    document.querySelectorAll('.pinbtn[data-pin-id]').forEach(b=>{
      const id=b.dataset.pinId;
      if(isPinned(id)){ b.classList.add('pinned'); b.innerHTML='\u2764'; }
      b.addEventListener('click',()=>{
        const on=togglePin({id, venue:b.dataset.venue, venueName:b.dataset.venueName, cat:b.dataset.cat, caption:b.dataset.caption});
        b.classList.toggle('pinned',on);
        b.innerHTML = on?'\u2764':'\u2661';
        toast(on?'Pinned to your board':'Removed from board', on?'\u{1F4CC}':'');
        const cnt=document.querySelector('.nav-board .cnt'); if(cnt) cnt.textContent=getPins().length;
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

  document.addEventListener('DOMContentLoaded',()=>{
    patchLinks(); initNav(); initFaves(); initNotes(); initPinButtons(); initMoodFilter(); initFolderBar();
  });
})();
