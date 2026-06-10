/* =====================================================================
   Venue editor — add / edit / delete a venue. Shared modal used from the
   venue grid (index.html, "Add a venue") and the venue page itself
   (venue.html, "Edit" / "Delete"). All writes go through window.WedStore
   and require sign-in.
   ===================================================================== */
(function(){
  "use strict";

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

  const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

  function slugify(s){
    return String(s||'').toLowerCase()
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/(^-+|-+$)/g,'') || 'venue';
  }

  function uniqueId(base, existing){
    let id = base, n = 2;
    const taken = new Set(existing.map(v=>v.id));
    while(taken.has(id)) id = `${base}-${n++}`;
    return id;
  }

  let dialog;
  function ensureDialog(){
    if(dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 've-dialog';
    document.body.appendChild(dialog);
    dialog.addEventListener('click', (e)=>{ if(e.target===dialog) dialog.close(); });
    return dialog;
  }

  function inclRowHTML(item){
    item = item || {ic:'', title:'', desc:''};
    return `<div class="ve-incl-row">
      <input class="ve-incl-ic" type="text" value="${esc(item.ic)}" placeholder="\u{1F4CC}" maxlength="4">
      <input class="ve-incl-title" type="text" value="${esc(item.title)}" placeholder="Title">
      <input class="ve-incl-desc" type="text" value="${esc(item.desc)}" placeholder="Description">
      <button type="button" class="ve-incl-remove" aria-label="Remove">&times;</button>
    </div>`;
  }

  function buildForm(venue){
    const v = venue || {};
    const sources = v.sources || {};
    const moods = (v.moods||[]).join(', ');
    const included = v.included && v.included.length ? v.included : [{ic:'',title:'',desc:''}];
    const isNew = !venue;

    return `
    <form method="dialog" class="ve-form">
      <h2 class="ve-title">${isNew ? 'Add a venue' : 'Edit venue'}</h2>

      <div class="ve-grid">
        <label class="ve-field"><span>Name</span><input name="name" type="text" required value="${esc(v.name)}"></label>
        <label class="ve-field"><span>Location</span><input name="location" type="text" value="${esc(v.location)}"></label>
        <label class="ve-field"><span>Theme</span><input name="theme" type="text" value="${esc(v.theme)}"></label>
        <label class="ve-field"><span>One-liner</span><input name="oneLiner" type="text" value="${esc(v.oneLiner)}"></label>
        <label class="ve-field"><span>Moods (comma-separated)</span><input name="moods" type="text" value="${esc(moods)}" placeholder="Tropical, Elegant, Fun"></label>
        <label class="ve-field"><span>Search term</span><input name="searchTerm" type="text" value="${esc(v.searchTerm)}" placeholder="Venue name + wedding"></label>
        <label class="ve-field"><span>Accent color</span><input name="vc" type="color" value="${/^#/.test(v.vc||'')?v.vc:'#0FB5BC'}"></label>
        <label class="ve-field"><span>Accent color (deep)</span><input name="vcDeep" type="color" value="${/^#/.test(v.vcDeep||'')?v.vcDeep:'#0A8A90'}"></label>
      </div>

      <label class="ve-field"><span>The pitch (lead paragraph)</span><textarea name="lead" rows="3">${esc(v.lead)}</textarea></label>
      <label class="ve-field"><span>Why it's interesting</span><textarea name="why" rows="3">${esc(v.why)}</textarea></label>
      <label class="ve-field"><span>Handwritten note</span><input name="note" type="text" value="${esc(v.note)}"></label>

      <div class="ve-grid">
        <label class="ve-field"><span>Official site URL</span><input name="siteUrl" type="url" value="${esc(sources.site)}" placeholder="https://"></label>
        <label class="ve-field"><span>Site label</span><input name="siteLabel" type="text" value="${esc(sources.siteLabel)}" placeholder="example.com"></label>
        <label class="ve-field"><span>Instagram URL</span><input name="igUrl" type="url" value="${esc(sources.ig)}" placeholder="https://instagram.com/..."></label>
        <label class="ve-field"><span>Instagram label</span><input name="igLabel" type="text" value="${esc(sources.igLabel)}" placeholder="@handle"></label>
      </div>

      <div class="ve-section">
        <div class="ve-section-head"><span>What's included</span><button type="button" class="ve-add" data-add="incl">+ Add item</button></div>
        <div class="ve-incl-list">${included.map(inclRowHTML).join('')}</div>
      </div>

      <div class="ve-actions">
        ${isNew ? '' : '<button type="button" class="ve-delete">Delete venue</button>'}
        <span class="ve-spacer"></span>
        <button type="button" class="ve-cancel">Cancel</button>
        <button type="submit" class="ve-save btn-fill">Save venue</button>
      </div>
    </form>`;
  }

  function readForm(form, base, existingVenues){
    const f = (name)=>form.elements[name] ? form.elements[name].value.trim() : '';
    const v = Object.assign({}, base);
    v.name = f('name');
    v.location = f('location');
    v.theme = f('theme');
    v.oneLiner = f('oneLiner');
    v.moods = f('moods').split(',').map(s=>s.trim()).filter(Boolean);
    v.searchTerm = f('searchTerm');
    v.vc = f('vc');
    v.vcDeep = f('vcDeep');
    v.lead = f('lead');
    v.why = f('why');
    v.note = f('note');
    v.sources = {
      site: f('siteUrl'), siteLabel: f('siteLabel'),
      ig: f('igUrl'), igLabel: f('igLabel'),
    };
    v.included = Array.from(form.querySelectorAll('.ve-incl-row')).map(row=>({
      ic: row.querySelector('.ve-incl-ic').value.trim(),
      title: row.querySelector('.ve-incl-title').value.trim(),
      desc: row.querySelector('.ve-incl-desc').value.trim(),
    })).filter(it=>it.title || it.desc || it.ic);
    if(!v.id){
      v.id = uniqueId(slugify(v.name), existingVenues);
      v.slug = v.id;
      v.orderIndex = existingVenues.reduce((m,x)=>Math.max(m, x.orderIndex||0), 0) + 1;
      v.num = `Venue ${String(existingVenues.length+1).padStart(2,'0')}`;
    }
    return v;
  }

  function open(venue, onSave){
    const dlg = ensureDialog();
    (async ()=>{
      dlg.innerHTML = buildForm(venue);
      const form = dlg.querySelector('form');

      form.querySelector('.ve-cancel').addEventListener('click', ()=>dlg.close());
      form.querySelector('.ve-incl-list').addEventListener('click', (e)=>{
        if(e.target.classList.contains('ve-incl-remove')){
          const list = form.querySelector('.ve-incl-list');
          if(list.children.length>1) e.target.closest('.ve-incl-row').remove();
        }
      });
      form.querySelector('[data-add="incl"]').addEventListener('click', ()=>{
        form.querySelector('.ve-incl-list').insertAdjacentHTML('beforeend', inclRowHTML());
      });
      const delBtn = form.querySelector('.ve-delete');
      if(delBtn) delBtn.addEventListener('click', async ()=>{
        if(!confirm(`Delete ${venue.name}? This can't be undone.`)) return;
        const store = await waitFor(()=>window.WedStore);
        try{
          await store.deleteVenue(venue.id);
          dlg.close();
          if(window.wedToast) window.wedToast('Venue deleted','\u{1F5D1}');
          if(onSave) onSave({deleted:true, id:venue.id});
        }catch(e){ if(window.wedToast) window.wedToast('Could not delete — try again',''); }
      });

      form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const store = await waitFor(()=>window.WedStore);
        if(!store) return;
        const saveBtn = form.querySelector('.ve-save');
        const existing = await store.getVenues();
        const data = readForm(form, venue||{}, existing);
        if(!data.name){ if(window.wedToast) window.wedToast('Give the venue a name',''); return; }
        saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
        try{
          await store.upsertVenue(data);
          dlg.close();
          if(window.wedToast) window.wedToast(venue?'Venue updated':'Venue added','\u{1F389}');
          if(onSave) onSave({deleted:false, venue:data});
        }catch(e){
          console.warn('[venue-editor] save failed', e);
          if(window.wedToast) window.wedToast('Could not save — try again','');
        }finally{
          saveBtn.disabled = false; saveBtn.textContent = 'Save venue';
        }
      });

      dlg.showModal();
    })();
  }

  window.WedVenueEditor = {
    openCreate: (onSave)=>{
      const auth = window.WedAuth;
      if(!auth || !auth.isSignedIn()){
        if(window.wedToast) window.wedToast('Sign in to add a venue','\u{1F510}');
        if(auth) auth.signIn();
        return;
      }
      open(null, onSave);
    },
    openEdit: (venue, onSave)=>{
      const auth = window.WedAuth;
      if(!auth || !auth.isSignedIn()){
        if(window.wedToast) window.wedToast('Sign in to edit this venue','\u{1F510}');
        if(auth) auth.signIn();
        return;
      }
      open(venue, onSave);
    },
  };
})();
