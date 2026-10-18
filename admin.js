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
  const sortStatus = document.querySelector('#sort-status');
  const editDialog = document.querySelector('#edit-project-dialog');
  const editForm = document.querySelector('#project-edit-form');
  const editStatus = document.querySelector('#edit-status');
  const editSaveButton = document.querySelector('#edit-save-button');
  const editImageInput = document.querySelector('#edit-project-image');
  const editImagePreview = document.querySelector('#edit-image-preview');
  let accessToken = sessionStorage.getItem('interiolance_admin_access_token') || '';
  let selectedPreviewUrl = '';
  let editPreviewObjectUrl = '';
  let editingProject = null;
  let loadedProjects = [];
  let isReordering = false;
  let draggedProjectId = null;

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
      const rows = await request('/rest/v1/' + encodeURIComponent(table) + '?select=id,title,category,description,image_url,image_path,image_alt,created_at,is_published,sort_order&order=sort_order.asc.nullslast,created_at.desc');
      loadedProjects = Array.isArray(rows) ? rows : [];
      projectTotal.textContent = String(loadedProjects.length);
      if (!loadedProjects.length) {
        projectList.replaceChildren(make('div', 'admin-empty', 'No projects uploaded yet. Add your first completed project above.'));
        return;
      }
      renderProjectList();
    } catch (error) {
      projectList.replaceChildren(make('p', 'admin-status is-error', 'Could not load projects: ' + (error.message || 'Check the Supabase connection and access policies.')));
    }
  }

  function renderProjectList() {
    projectList.replaceChildren();
    loadedProjects.forEach((project, index) => {
      const item = make('article', 'admin-project-row');
      item.dataset.projectId = String(project.id);
      item.draggable = !isReordering;
      item.setAttribute('aria-label', (project.title || 'Untitled project') + ', position ' + (index + 1));
      item.addEventListener('dragstart', event => {
        if (isReordering) { event.preventDefault(); return; }
        draggedProjectId = String(project.id);
        item.classList.add('is-dragging');
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', draggedProjectId);
        }
      });
      item.addEventListener('dragover', event => {
        if (!draggedProjectId || draggedProjectId === String(project.id) || isReordering) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        item.classList.add('is-drop-target');
      });
      item.addEventListener('dragleave', () => item.classList.remove('is-drop-target'));
      item.addEventListener('drop', event => {
        event.preventDefault();
        item.classList.remove('is-drop-target');
        const sourceId = draggedProjectId || (event.dataTransfer && event.dataTransfer.getData('text/plain'));
        draggedProjectId = null;
        if (!sourceId || sourceId === String(project.id)) return;
        const reordered = loadedProjects.slice();
        const from = reordered.findIndex(entry => String(entry.id) === String(sourceId));
        const to = reordered.findIndex(entry => String(entry.id) === String(project.id));
        if (from < 0 || to < 0) return;
        const moved = reordered.splice(from, 1)[0];
        reordered.splice(to, 0, moved);
        saveProjectOrder(reordered);
      });
      item.addEventListener('dragend', () => {
        draggedProjectId = null;
        projectList.querySelectorAll('.is-dragging, .is-drop-target').forEach(node => node.classList.remove('is-dragging', 'is-drop-target'));
      });

      const image = make('img', 'admin-project-thumb');
      image.src = project.image_url || '';
      image.alt = project.image_alt || project.title || '';
      image.loading = 'lazy';
      const copy = make('div', 'admin-project-copy');
      copy.append(make('span', 'admin-project-category', project.category || 'Interior design'), make('h3', '', project.title || 'Untitled project'), make('p', '', project.description || 'No description added'));
      if (project.created_at) copy.appendChild(make('small', 'admin-project-date', 'Added ' + new Date(project.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })));

      const actions = make('div', 'admin-project-actions');
      const sorting = make('div', 'admin-sort-controls');
      const moveUp = make('button', 'admin-sort-button', '↑ Move up');
      moveUp.type = 'button';
      moveUp.title = 'Move earlier in the carousel';
      moveUp.setAttribute('aria-label', 'Move ' + (project.title || 'project') + ' earlier');
      moveUp.disabled = isReordering || index === 0;
      moveUp.addEventListener('click', () => moveProject(project.id, -1));
      const moveDown = make('button', 'admin-sort-button', '↓ Move down');
      moveDown.type = 'button';
      moveDown.title = 'Move later in the carousel';
      moveDown.setAttribute('aria-label', 'Move ' + (project.title || 'project') + ' later');
      moveDown.disabled = isReordering || index === loadedProjects.length - 1;
      moveDown.addEventListener('click', () => moveProject(project.id, 1));
      sorting.append(moveUp, moveDown);

      const position = make('span', 'admin-sort-position', 'Order ' + (index + 1));
      position.title = 'Current website display order';
      const edit = make('button', 'admin-edit-button', 'Edit');
      edit.type = 'button';
      edit.disabled = isReordering;
      edit.addEventListener('click', () => openEditDialog(project));
      const remove = make('button', 'admin-delete-button', 'Remove');
      remove.type = 'button';
      remove.disabled = isReordering;
      remove.addEventListener('click', () => deleteProject(project, remove));
      actions.append(position, sorting, edit, remove);
      item.append(image, copy, actions);
      projectList.appendChild(item);
    });
  }

  function moveProject(projectId, offset) {
    if (isReordering) return;
    const reordered = loadedProjects.slice();
    const from = reordered.findIndex(project => String(project.id) === String(projectId));
    const to = from + offset;
    if (from < 0 || to < 0 || to >= reordered.length) return;
    const moved = reordered.splice(from, 1)[0];
    reordered.splice(to, 0, moved);
    saveProjectOrder(reordered);
  }

  async function saveProjectOrder(orderedProjects) {
    if (isReordering) return;
    isReordering = true;
    setStatus(sortStatus, 'Saving display order…', false);
    renderProjectList();
    try {
      // Persist the complete order as a simple zero-based sequence, avoiding gaps.
      for (let index = 0; index < orderedProjects.length; index += 1) {
        const project = orderedProjects[index];
        const desiredOrder = index;
        if (Number(project.sort_order) === desiredOrder) continue;
        await request('/rest/v1/' + encodeURIComponent(table) + '?id=eq.' + encodeURIComponent(project.id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ sort_order: desiredOrder })
        });
      }
      loadedProjects = orderedProjects.map((project, index) => ({ ...project, sort_order: index }));
      setStatus(sortStatus, 'Order saved. The first project here appears first in the public carousel.', false);
    } catch (error) {
      setStatus(sortStatus, 'Could not save the new order: ' + (error.message || 'Check database permissions and the sort_order column.'), true);
      // Re-read database state if a multi-row reorder was only partially saved.
      await loadProjectList();
    } finally {
      isReordering = false;
      renderProjectList();
    }
  }

  function openEditDialog(project) {
    editingProject = project;
    editForm.reset();
    editForm.elements.id.value = project.id;
    editForm.elements.title.value = project.title || '';
    editForm.elements.description.value = project.description || '';
    editForm.elements.alt.value = project.image_alt || '';

    const categorySelect = editForm.elements.category;
    const existingOption = Array.from(categorySelect.options).find(option => option.value === (project.category || ''));
    if (!existingOption && project.category) {
      const customOption = document.createElement('option');
      customOption.value = project.category;
      customOption.textContent = project.category;
      categorySelect.appendChild(customOption);
    }
    categorySelect.value = project.category || 'Full-home interiors';

    clearEditPreviewObjectUrl();
    editImagePreview.src = project.image_url || '';
    editImagePreview.alt = project.image_alt || project.title || 'Current project image';
    setStatus(editStatus, '', false);
    editSaveButton.disabled = false;
    editDialog.showModal();
  }

  function clearEditPreviewObjectUrl() {
    if (editPreviewObjectUrl) URL.revokeObjectURL(editPreviewObjectUrl);
    editPreviewObjectUrl = '';
  }

  function showEditPreview(file) {
    clearEditPreviewObjectUrl();
    if (file) {
      editPreviewObjectUrl = URL.createObjectURL(file);
      editImagePreview.src = editPreviewObjectUrl;
    } else if (editingProject && editingProject.image_url) {
      editImagePreview.src = editingProject.image_url;
    } else {
      editImagePreview.removeAttribute('src');
    }
  }

  function validateImage(file) {
    if (!file) return '';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Use a JPG, PNG or WebP image.';
    if (file.size > 8 * 1024 * 1024) return 'That image is larger than 8 MB. Please resize it and try again.';
    return '';
  }

  async function uploadImageFile(file, title) {
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const uniqueId = window.crypto && typeof window.crypto.randomUUID === 'function' ? window.crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    const imagePath = Date.now() + '-' + slugify(title) + '-' + uniqueId + '.' + extension;
    await request('/storage/v1/object/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(imagePath), {
      method: 'POST',
      headers: { 'Content-Type': file.type, 'x-upsert': 'false' },
      body: file
    });
    return {
      imagePath,
      imageUrl: baseUrl + '/storage/v1/object/public/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(imagePath)
    };
  }

  async function saveEditedProject(event) {
    event.preventDefault();
    if (!editingProject) return;

    const fields = new FormData(editForm);
    const file = fields.get('image');
    const validationError = validateImage(file instanceof File && file.size ? file : null);
    if (validationError) {
      setStatus(editStatus, validationError, true);
      return;
    }

    const title = String(fields.get('title') || '').trim();
    if (!title) {
      setStatus(editStatus, 'Project title is required.', true);
      return;
    }

    editSaveButton.disabled = true;
    editDialog.querySelectorAll('button[type="button"]').forEach(button => { button.disabled = true; });
    setStatus(editStatus, file instanceof File && file.size ? 'Uploading replacement image and saving changes…' : 'Saving project changes…', false);
    let uploadedImagePath = '';
    let databaseUpdated = false;
    try {
      const category = String(fields.get('category') || 'Full-home interiors').trim();
      const description = String(fields.get('description') || '').trim();
      const imageAlt = String(fields.get('alt') || title).trim();
      const update = { title, category, description, image_alt: imageAlt };

      if (file instanceof File && file.size) {
        const uploaded = await uploadImageFile(file, title);
        uploadedImagePath = uploaded.imagePath;
        update.image_url = uploaded.imageUrl;
        update.image_path = uploaded.imagePath;
      }

      await request('/rest/v1/' + encodeURIComponent(table) + '?id=eq.' + encodeURIComponent(editingProject.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(update)
      });
      databaseUpdated = true;

      let cleanupWarning = '';
      if (uploadedImagePath && editingProject.image_path && editingProject.image_path !== uploadedImagePath) {
        try {
          await request('/storage/v1/object/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(editingProject.image_path), { method: 'DELETE' });
        } catch (_) {
          cleanupWarning = ' The project was updated, but the previous image could not be deleted automatically.';
        }
      }

      setStatus(editStatus, 'Changes saved. The public portfolio will show the updated project on its next load.' + cleanupWarning, false);
      await loadProjectList();
      if (cleanupWarning) window.alert(cleanupWarning.trim());
      window.setTimeout(() => {
        if (editDialog.open) editDialog.close();
      }, 900);
    } catch (error) {
      if (uploadedImagePath && !databaseUpdated) {
        try { await request('/storage/v1/object/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(uploadedImagePath), { method: 'DELETE' }); } catch (_) { /* best-effort cleanup */ }
      }
      setStatus(editStatus, 'Could not save changes: ' + (error.message || 'Check your connection and access policies.'), true);
    } finally {
      editSaveButton.disabled = false;
      editDialog.querySelectorAll('button[type="button"]').forEach(button => { button.disabled = false; });
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
      const lastPositions = await request('/rest/v1/' + encodeURIComponent(table) + '?select=sort_order&order=sort_order.desc.nullslast&limit=1');
      const nextSortOrder = Array.isArray(lastPositions) && lastPositions.length ? Number(lastPositions[0].sort_order || 0) + 1 : 0;
      await request('/rest/v1/' + encodeURIComponent(table), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ title, category, description, image_url: imageUrl, image_path: imagePath, image_alt: imageAlt, is_published: true, sort_order: nextSortOrder })
      });
      setStatus(uploadStatus, 'Published at the end of your current display order. You can move it into place below.', false);
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
  editImageInput.addEventListener('change', event => showEditPreview(event.target.files && event.target.files[0]));
  editForm.addEventListener('submit', saveEditedProject);
  document.querySelector('#edit-dialog-close').addEventListener('click', () => editDialog.close());
  document.querySelector('#edit-dialog-cancel').addEventListener('click', () => editDialog.close());
  editDialog.addEventListener('cancel', event => {
    if (editSaveButton.disabled) event.preventDefault();
  });
  editDialog.addEventListener('close', () => {
    clearEditPreviewObjectUrl();
    editingProject = null;
  });

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
