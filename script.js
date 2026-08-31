// ---- Edit mode toggle (shared across pages) ----
// Editable text is saved to localStorage the moment you click "Done editing",
// so your changes persist next time you open the site in the same browser.

function initEditMode() {
  const toggle = document.getElementById('edit-toggle');
  const hint = document.getElementById('save-hint');
  if (!toggle) return;

  const editableEls = document.querySelectorAll('[contenteditable]');

  function setEditing(on) {
    document.body.classList.toggle('editing', on);
    editableEls.forEach(el => el.setAttribute('contenteditable', on ? 'true' : 'false'));
    toggle.textContent = on ? 'Done editing' : 'Edit this page';
    toggle.classList.toggle('active', on);
    document.querySelectorAll('.project-remove, .add-project-btn, .photo-upload-btn').forEach(el => {
      el.style.display = on ? '' : 'none';
    });
    if (document.getElementById('project-list')) renderProjects();
  }

  toggle.addEventListener('click', () => {
    const turningOff = document.body.classList.contains('editing');
    if (turningOff) {
      saveEditableContent();
      hint.textContent = 'Saved in this browser.';
      hint.classList.add('show');
      setTimeout(() => hint.classList.remove('show'), 2000);
    }
    setEditing(!turningOff);
  });

  // Load any previously saved text into contenteditable fields
  loadEditableContent();
}

function storageKeyFor(el) {
  return 'site:' + location.pathname.replace(/\W/g, '_') + ':' + el.id;
}

function saveEditableContent() {
  document.querySelectorAll('[contenteditable][id]').forEach(el => {
    localStorage.setItem(storageKeyFor(el), el.innerHTML);
  });
}

function loadEditableContent() {
  document.querySelectorAll('[contenteditable][id]').forEach(el => {
    const saved = localStorage.getItem(storageKeyFor(el));
    if (saved !== null) el.innerHTML = saved;
  });
}

document.addEventListener('DOMContentLoaded', initEditMode);


// ---- Portfolio: add / remove project cards ----
// Projects are stored as JSON in localStorage under "site:projects".

const PROJECTS_KEY = 'site:projects';

const DEFAULT_PROJECTS = [
  {
    title: 'Tensile Strength & CAD Phone Case Design',
    role: 'EGR 100 Group Project · Michigan State University',
    desc: 'My first CAD experience, built for my Engineering 100 course at MSU. Our team designed a phone case that needed to be unique while still withstanding force, modeled it in Autodesk Fusion 360, and ran tensile strength testing on the final design.',
    link: '',
    tags: ['Autodesk Fusion 360', 'CAD', 'Tensile Testing'],
    images: ['images/phone-case-1.png', 'images/phone-case-2.png']
  },
  {
    title: 'Joystick Timing Game',
    role: 'Personal Project',
    desc: 'A simple reaction/timing game built with a joystick and LEDs on a breadboard, inspired by a game I saw and wanted to recreate. Used an LCD 1602 display for the first time to show game prompts.',
    link: 'https://youtu.be/p_02Ek7JiuU',
    tags: ['Arduino', 'Breadboard', 'LCD 1602'],
    images: ['images/timing-game-1.png', 'images/timing-game-2.jpg']
  },
  {
    title: 'IEEE Macro Pad',
    role: 'MSU IEEE Club',
    desc: 'My first PCB design, built with Michigan State\'s IEEE chapter. Designed the schematic and board layout in KiCad for a 6-key macro pad with a rotary encoder and OLED display.',
    link: '',
    tags: ['KiCad', 'PCB Design', 'Arduino'],
    images: ['images/macropad-1.png', 'images/macropad-2.png', 'images/macropad-3.png']
  }
];

function loadProjects() {
  const raw = localStorage.getItem(PROJECTS_KEY);
  if (!raw) return DEFAULT_PROJECTS.slice();
  try { return JSON.parse(raw); } catch (e) { return DEFAULT_PROJECTS.slice(); }
}

function saveProjects(projects) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function renderProjects() {
  const list = document.getElementById('project-list');
  if (!list) return;
  const projects = loadProjects();
  const editing = document.body.classList.contains('editing');

  if (projects.length === 0) {
    list.innerHTML = '<div class="empty-state">No projects yet. Click "Edit this page," then "Add a project" to add your first one.</div>';
    return;
  }

  list.innerHTML = projects.map((p, i) => `
    <div class="project-card" data-index="${i}">
      <button class="project-remove" style="display:${editing ? 'block' : 'none'}" onclick="removeProject(${i})">Remove project</button>
      <div class="project-photos-grid">
        ${(p.images || []).map((src, pi) => `
          <div class="project-photo-thumb-wrap">
            <img class="project-photo-thumb" src="${src}" alt="${escapeHtml(p.title)}">
            <button class="project-photo-remove" style="display:${editing ? 'flex' : 'none'}" onclick="removeProjectPhoto(${i}, ${pi})">&times;</button>
          </div>
        `).join('')}
        <label class="add-photo-tile" style="display:${editing ? 'flex' : 'none'}">
          + Add photo
          <input type="file" accept="image/*" style="display:none;" onchange="uploadProjectPhoto(${i}, this)">
        </label>
        ${(!p.images || p.images.length === 0) && !editing ? '<div class="project-photo-placeholder">No photos yet</div>' : ''}
      </div>
      <h3 class="project-title" contenteditable="${editing}" onblur="updateProject(${i}, 'title', this.innerText)">${escapeHtml(p.title)}</h3>
      <p class="project-role" contenteditable="${editing}" onblur="updateProject(${i}, 'role', this.innerText)">${escapeHtml(p.role)}</p>
      <p class="project-desc" contenteditable="${editing}" onblur="updateProject(${i}, 'desc', this.innerText)">${escapeHtml(p.desc)}</p>
      <div class="project-tags">${p.tags.map((t, ti) => `<span class="skill-tag" contenteditable="${editing}" onblur="updateTag(${i}, ${ti}, this.innerText)">${escapeHtml(t)}</span>`).join('')}</div>
      ${p.link || editing ? `<a class="project-link" href="${p.link || '#'}" contenteditable="${editing}" onblur="updateProject(${i}, 'link', this.innerText)" target="_blank" rel="noopener">${escapeHtml(p.link || 'Add a link')}</a>` : ''}
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function updateProject(index, field, value) {
  const projects = loadProjects();
  if (!projects[index]) return;
  projects[index][field] = value;
  saveProjects(projects);
}

function updateTag(index, tagIndex, value) {
  const projects = loadProjects();
  if (!projects[index]) return;
  projects[index].tags[tagIndex] = value;
  saveProjects(projects);
}

function addProject() {
  const projects = loadProjects();
  projects.push({
    title: 'New project',
    role: 'Your role · Year',
    desc: 'Describe what you built and the impact it had.',
    link: '',
    tags: ['Tag'],
    images: []
  });
  saveProjects(projects);
  renderProjects();
}

function uploadProjectPhoto(index, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const projects = loadProjects();
    if (!projects[index]) return;
    if (!projects[index].images) projects[index].images = [];
    projects[index].images.push(reader.result);
    saveProjects(projects);
    renderProjects();
  };
  reader.readAsDataURL(file);
}

function removeProjectPhoto(index, photoIndex) {
  const projects = loadProjects();
  if (!projects[index] || !projects[index].images) return;
  projects[index].images.splice(photoIndex, 1);
  saveProjects(projects);
  renderProjects();
}

function removeProject(index) {
  const projects = loadProjects();
  projects.splice(index, 1);
  saveProjects(projects);
  renderProjects();
}

document.addEventListener('DOMContentLoaded', renderProjects);


// ---- Photo upload (profile photo + project photos) ----
// Images are stored as base64 data in localStorage. This keeps things simple with
// no server, but note two limits: (1) it only shows on the browser/device where you
// uploaded it — see the "publishing for real" note in the README section below,
// and (2) localStorage tops out around 5MB total, so keep photos reasonably sized
// (a phone photo resized to ~1000px wide is plenty).

const PHOTO_KEY = 'site:photo';

function initProfilePhoto() {
  const img = document.getElementById('profile-photo');
  const placeholder = document.getElementById('photo-placeholder');
  const input = document.getElementById('photo-input');
  if (!img || !input) return;

  const saved = localStorage.getItem(PHOTO_KEY);
  if (saved) {
    img.src = saved;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  }

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem(PHOTO_KEY, reader.result);
      img.src = reader.result;
      img.style.display = 'block';
      placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', initProfilePhoto);
