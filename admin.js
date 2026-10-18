(function () {
  'use strict';

  const config = window.INTERIOLANCE_SUPABASE || {};
  const configured = Boolean(config.url && config.anonKey);
  const baseUrl = (config.url || '').replace(/\/$/, '');
  const bucket = config.bucket || 'project-images';
  const table = config.table || 'projects';
  const setupPanel = document.querySelector('#portfolio-setup-required');
  const loginPanel = document.querySelector('#admin-login-panel');
  const manager = document.querySelector('#portfolio-manager');
  const loginForm = document.querySelector('#admin-login-form');
  const loginStatus = document.querySelector('#login-status');
  const uploadForm = document.querySelector('#project-upload-form');
  const uploadStatus = document.querySelector('#upload-status');
  const uploadButton = document.querySelector('#upload-submit');
  const projectList = document.querySelector('#admin-project-list');
  const projectTotal = document.querySelector('#project-total');
  let accessToken = sessionStorage.getItem('interiolance_admin_access_token') || '';
  let selectedPreviewUrl = '';

  function setStatus(node, message, isError) {
    if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-error', Boolean(isError));
    node.classList.toggle('is-success', Boolean(message) && !isError);
  }

  async function request(path, options) {
    const opts = options || {};
    const headers = new Headers(opts.headers || {});
    headers.set('apikey', config.anonKey);
    if (accessToken && !opts.publicAuth) headers.set('Authorization', 'Bearer ' + accessToken);
    else if (!headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + config.anonKey);
    const response = await fetch(baseUrl + path, { ...opts, headers });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch (_) { payload = text; }
    if (!response.ok) {
      const message = payload && (payload.message || payload.msg || payload.error_description || payload.error) || 'Request failed (' + response.status + ').';
      throw new Error(message);
    }
    return payload;
  }

  function showSignedIn(isSignedIn) {
    loginPanel.hidden = isSignedIn;
    manager.hidden = !isSignedIn;
    if (isSignedIn) loadProjectList();
  }

  function slugify(value) {
    return String(value || 'project').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55) || 'project';
  }

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  async function signIn(event) {
    event.preventDefault();
    const submit = loginForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus(loginStatus, 'Signing in…', false);
    try {
      const values = new FormData(loginForm);
      const session = await request('/auth/v1/token?grant_type=password', {
        method: 'POST',
        publicAuth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.get('email'), password: values.get('password') })
      });
      if (!session || !session.access_token) throw new Error('Sign-in did not return an access token.');
      accessToken = session.access_token;
      sessionStorage.setItem('interiolance_admin_access_token', accessToken);
      loginForm.reset();
      setStatus(loginStatus, '', false);
      showSignedIn(true);
    } catch (error) {
      setStatus(loginStatus, error.message || 'Could not sign in. Check your credentials and connection.', true);
    } finally {
      submit.disabled = false;
    }
  }

  async function loadProjectList() {
    projectList.replaceChildren(make('p', 'admin-muted', 'Loading projects…'));
    try {
      const rows = await request('/rest/v1/' + encodeURIComponent(table) + '?select=id,title,category,description,image_url,image_path,image_alt,created_at,is_published&order=created_at.desc');
      projectList.replaceChildren();
      projectTotal.textContent = String(Array.isArray(rows) ? rows.length : 0);
      if (!Array.isArray(rows) || rows.length === 0) {
        projectList.appendChild(make('div', 'admin-empty', 'No projects uploaded yet. Add your first completed project above.'));
        return;
      }
      rows.forEach((project) => {
        const item = make('article', 'admin-project-row');
        const image = make('img', 'admin-project-thumb');
        image.src = project.image_url;
        image.alt = project.image_alt || project.title || '';
        image.loading = 'lazy';
        const copy = make('div', 'admin-project-copy');
        copy.append(make('span', 'admin-project-category', project.category || 'Interior design'), make('h3', '', project.title || 'Untitled project'), make('p', '', project.description || 'No description added'));
        if (project.created_at) copy.appendChild(make('small', 'admin-project-date', 'Added ' + new Date(project.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })));
        const remove = make('button', 'admin-delete-button', 'Remove');
        remove.type = 'button';
        remove.addEventListener('click', () => deleteProject(project, remove));
        item.append(image, copy, remove);
        projectList.appendChild(item);
      });
    } catch (error) {
      projectList.replaceChildren(make('p', 'admin-status is-error', 'Could not load projects: ' + (error.message || 'Check the Supabase connection and access policies.')));
    }
  }

  async function uploadProject(event) {
    event.preventDefault();
    const fields = new FormData(uploadForm);
    const file = fields.get('image');
    if (!(file instanceof File) || !file.size) {
      setStatus(uploadStatus, 'Choose a project image first.', true);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatus(uploadStatus, 'Use a JPG, PNG or WebP image.', true);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setStatus(uploadStatus, 'That image is larger than 8 MB. Please resize it and try again.', true);
      return;
    }

    uploadButton.disabled = true;
    setStatus(uploadStatus, 'Uploading image and publishing project…', false);
    let imagePath = '';
    let imageUrl = '';
    try {
      const title = String(fields.get('title') || '').trim();
      const category = String(fields.get('category') || 'Interior Design').trim();
      const description = String(fields.get('description') || '').trim();
      const imageAlt = String(fields.get('alt') || title).trim();
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
      const uniqueId = window.crypto && typeof window.crypto.randomUUID === 'function' ? window.crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2, 10);
      imagePath = Date.now() + '-' + slugify(title) + '-' + uniqueId + '.' + extension;
      await request('/storage/v1/object/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(imagePath), {
        method: 'POST',
        headers: { 'Content-Type': file.type, 'x-upsert': 'false' },
        body: file
      });
      imageUrl = baseUrl + '/storage/v1/object/public/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(imagePath);
      await request('/rest/v1/' + encodeURIComponent(table), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ title, category, description, image_url: imageUrl, image_path: imagePath, image_alt: imageAlt, is_published: true })
      });
      setStatus(uploadStatus, 'Published. The project will appear in the carousel on the next page load.', false);
      uploadForm.reset();
      document.querySelector('#image-preview-wrap').hidden = true;
      document.querySelector('#image-preview').removeAttribute('src');
      if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
      selectedPreviewUrl = '';
      await loadProjectList();
    } catch (error) {
      // Avoid leaving an orphaned storage object if the metadata insert fails.
      if (imagePath) {
        try { await request('/storage/v1/object/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(imagePath), { method: 'DELETE' }); } catch (_) { /* best-effort cleanup */ }
      }
      setStatus(uploadStatus, 'Upload failed: ' + (error.message || 'Check your storage bucket and access policies.'), true);
    } finally {
      uploadButton.disabled = false;
    }
  }

  async function deleteProject(project, button) {
    if (!window.confirm('Remove “' + (project.title || 'this project') + '” from the public portfolio?')) return;
    button.disabled = true;
    try {
      await request('/rest/v1/' + encodeURIComponent(table) + '?id=eq.' + encodeURIComponent(project.id), { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } });
      let cleanupWarning = '';
      if (project.image_path) {
        try { await request('/storage/v1/object/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(project.image_path), { method: 'DELETE' }); }
        catch (_) { cleanupWarning = ' The project was removed, but the image file could not be deleted automatically.'; }
      }
      await loadProjectList();
      if (cleanupWarning) window.alert(cleanupWarning.trim());
    } catch (error) {
      window.alert('Could not remove project: ' + (error.message || 'Please try again.'));
      button.disabled = false;
    }
  }

  function showPreview(file) {
    const wrap = document.querySelector('#image-preview-wrap');
    const image = document.querySelector('#image-preview');
    if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
    if (!file) { wrap.hidden = true; image.removeAttribute('src'); selectedPreviewUrl = ''; return; }
    selectedPreviewUrl = URL.createObjectURL(file);
    image.src = selectedPreviewUrl;
    wrap.hidden = false;
  }

  document.querySelector('#admin-sign-out').addEventListener('click', async () => {
    try { if (accessToken) await request('/auth/v1/logout', { method: 'POST' }); } catch (_) { /* local sign out still proceeds */ }
    accessToken = '';
    sessionStorage.removeItem('interiolance_admin_access_token');
    showSignedIn(false);
    setStatus(loginStatus, 'Signed out.', false);
  });
  document.querySelector('#refresh-projects').addEventListener('click', loadProjectList);
  document.querySelector('#project-image').addEventListener('change', event => showPreview(event.target.files && event.target.files[0]));

  if (!configured) {
    setupPanel.hidden = false;
    loginPanel.hidden = true;
    manager.hidden = true;
  } else {
    setupPanel.hidden = true;
    if (accessToken) showSignedIn(true);
    else { loginPanel.hidden = false; manager.hidden = true; }
  }
  loginForm.addEventListener('submit', signIn);
  uploadForm.addEventListener('submit', uploadProject);
})();
