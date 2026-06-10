// =====================================================================
// Shared family data store — favorites, notes, board pins, and image
// slot positions, all synced via Supabase so everyone sees the same
// state. Replaces the old localStorage-only versions in app.js.
// Exposes window.WedStore for app.js / image-slot.js (plain scripts).
// =====================================================================
import { supabase } from './supabase-config.js';

function userName(user) {
  const meta = user && user.user_metadata || {};
  return meta.full_name || meta.name || (user && user.email) || null;
}

function requireUser() {
  const user = window.WedAuth && window.WedAuth.getUser();
  if (!user) throw new Error('not-signed-in');
  return user;
}

// ---------------- favorites (one shared status per venue) ----------------
async function getFavorites() {
  const { data, error } = await supabase.from('favorites').select('venue_id,status');
  if (error) { console.warn('[WedStore] getFavorites', error); return {}; }
  const out = {};
  (data || []).forEach((r) => { out[r.venue_id] = r.status; });
  return out;
}

async function setFavorite(venueId, status) {
  const user = requireUser();
  if (status === null) {
    const { error } = await supabase.from('favorites').delete().eq('venue_id', venueId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('favorites').upsert({
    venue_id: venueId,
    status,
    updated_by: user.id,
    updated_by_name: userName(user),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ---------------- notes (one shared note per venue) ----------------
async function getNote(venueId) {
  const { data, error } = await supabase.from('notes').select('body').eq('venue_id', venueId).maybeSingle();
  if (error) { console.warn('[WedStore] getNote', error); return ''; }
  return (data && data.body) || '';
}

async function setNote(venueId, body) {
  const user = requireUser();
  const { error } = await supabase.from('notes').upsert({
    venue_id: venueId,
    body,
    updated_by: user.id,
    updated_by_name: userName(user),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ---------------- inspiration board pins ----------------
async function getPins() {
  const { data, error } = await supabase.from('pins').select('*').order('created_at', { ascending: true });
  if (error) { console.warn('[WedStore] getPins', error); return []; }
  return data || [];
}

async function addPin(rec) {
  const user = requireUser();
  const { error } = await supabase.from('pins').insert({
    id: rec.id,
    venue_id: rec.venue,
    venue_name: rec.venueName || null,
    cat: rec.cat || null,
    caption: rec.caption || null,
    created_by: user.id,
    created_by_name: userName(user),
  });
  if (error) throw error;
}

async function removePin(id) {
  requireUser();
  const { error } = await supabase.from('pins').delete().eq('id', id);
  if (error) throw error;
}

// ---------------- image slots (Supabase Storage-backed photos) ----------------
async function getImageSlots() {
  const { data, error } = await supabase.from('image_slots').select('*');
  if (error) { console.warn('[WedStore] getImageSlots', error); return {}; }
  const out = {};
  (data || []).forEach((r) => {
    out[r.id] = { u: r.url, s: r.scale == null ? 1 : r.scale, x: r.x || 0, y: r.y || 0 };
  });
  return out;
}

async function uploadImage(id, blob, ext) {
  requireUser();
  const path = `${id}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('wedding-photos')
    .upload(path, blob, { upsert: true, contentType: blob.type });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from('wedding-photos').getPublicUrl(path);
  return data.publicUrl;
}

async function setImageSlot(id, val) {
  const user = requireUser();
  if (!val) {
    const { error } = await supabase.from('image_slots').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('image_slots').upsert({
    id,
    url: val.u,
    scale: val.s == null ? 1 : val.s,
    x: val.x || 0,
    y: val.y || 0,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

window.WedStore = {
  getFavorites, setFavorite,
  getNote, setNote,
  getPins, addPin, removePin,
  getImageSlots, uploadImage, setImageSlot,
};
