// India Tours & Travels - Admin Panel JavaScript
const API_BASE = 'http://localhost:3000/api';

// ============================================================
// AUTH
// ============================================================

function checkAuth() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '../login.html';
    return null;
  }
  // Display admin email
  const email = localStorage.getItem('adminEmail') || 'admin@indiatours.com';
  const el = document.getElementById('adminEmailDisplay');
  if (el) el.textContent = email;
  return token;
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    window.location.href = '../login.html';
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// ============================================================
// API ERROR HANDLER
// ============================================================

async function handleApiError(response) {
  if (response.status === 401 || response.status === 403) {
    alert('Session expired. Please login again.');
    localStorage.removeItem('adminToken');
    window.location.href = '../login.html';
    return;
  }
  const data = await response.json().catch(() => ({}));
  throw new Error(data.error || `HTTP ${response.status}`);
}

// ============================================================
// SECTION NAVIGATION
// ============================================================

function showSection(name) {
  // Hide all sections
  document.querySelectorAll('[id^="section-"]').forEach(s => s.classList.add('hidden'));

  // Deactivate nav items
  document.querySelectorAll('.admin-nav-item').forEach(item => item.classList.remove('active'));

  // Show selected section
  const section = document.getElementById(`section-${name}`);
  if (section) section.classList.remove('hidden');

  // Activate nav item
  const navItem = document.getElementById(`nav-${name}`);
  if (navItem) navItem.classList.add('active');

  // Update page title
  const titles = {
    overview: ['Dashboard Overview', 'Welcome back, Admin'],
    packages: ['Manage Packages', 'Add, edit or remove tour packages'],
    bookings: ['Manage Bookings', 'View all customer enquiries'],
    pricing: ['Pricing Management', 'Update package prices quickly'],
    content: ['Content Management', 'Edit website content']
  };

  const titleEl = document.getElementById('pageTitle');
  const subtitleEl = document.getElementById('pageSubtitle');
  if (titleEl && titles[name]) titleEl.textContent = titles[name][0];
  if (subtitleEl && titles[name]) subtitleEl.textContent = titles[name][1];

  // Load data for the section
  if (name === 'overview') loadOverview();
  else if (name === 'packages') loadPackages();
  else if (name === 'bookings') loadBookings();
  else if (name === 'pricing') loadPricing();
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('mobileSidebar');
  sidebar.classList.toggle('hidden');
}

// ============================================================
// OVERVIEW
// ============================================================

async function loadOverview() {
  try {
    const [packagesRes, bookingsRes] = await Promise.all([
      fetch(`${API_BASE}/packages`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/bookings`, { headers: getAuthHeaders() })
    ]);

    const packages = packagesRes.ok ? await packagesRes.json() : [];
    const bookings = bookingsRes.ok ? await bookingsRes.json() : [];

    const hajjPkgs = packages.filter(p => p.category === 'Hajj' || p.category === 'Umrah');
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.created_at && b.created_at.startsWith(today));

    document.getElementById('stat-bookings').textContent = bookings.length;
    document.getElementById('stat-packages').textContent = packages.length;
    document.getElementById('stat-hajj').textContent = hajjPkgs.length;
    document.getElementById('stat-today').textContent = todayBookings.length;

    // Show notification badge if there are today's bookings
    if (todayBookings.length > 0) {
      const badge = document.getElementById('notifBadge');
      if (badge) {
        badge.textContent = todayBookings.length;
        badge.classList.remove('hidden');
      }
    }

    // Recent bookings (last 5)
    const recent = bookings.slice(-5).reverse();
    const tableEl = document.getElementById('recentBookingsTable');
    if (tableEl) {
      if (!recent.length) {
        tableEl.innerHTML = '<p class="text-gray-400 text-sm py-4 text-center">No bookings yet.</p>';
      } else {
        tableEl.innerHTML = `
          <table class="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Service</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${recent.map(b => `
                <tr>
                  <td class="text-gray-400">#${b.id}</td>
                  <td class="font-medium">${escapeHtml(b.name)}</td>
                  <td><a href="tel:${b.phone}" class="text-blue-600 hover:underline">${escapeHtml(b.phone)}</a></td>
                  <td><span class="badge badge-green">${escapeHtml(b.service_type || '')}</span></td>
                  <td class="text-gray-400 text-xs">${formatDate(b.booking_date || b.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>`;
      }
    }
  } catch (err) {
    console.error('Overview load error:', err);
    document.getElementById('stat-bookings').textContent = '?';
    document.getElementById('stat-packages').textContent = '?';
    document.getElementById('stat-hajj').textContent = '?';
    document.getElementById('stat-today').textContent = '?';
  }
}

// ============================================================
// PACKAGES
// ============================================================

let packagesCache = [];

async function loadPackages() {
  const tbody = document.getElementById('packagesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8"><div class="spinner mx-auto"></div></td></tr>';

  try {
    const response = await fetch(`${API_BASE}/packages`, { headers: getAuthHeaders() });
    if (!response.ok) await handleApiError(response);
    packagesCache = await response.json();

    tbody.innerHTML = packagesCache.map(pkg => `
      <tr>
        <td class="text-gray-400 text-xs">#${pkg.id}</td>
        <td class="font-medium text-gray-800 max-w-xs">
          <div class="truncate">${escapeHtml(pkg.name)}</div>
          <div class="text-xs text-gray-400 truncate mt-0.5">${escapeHtml(pkg.description || '').substring(0, 50)}...</div>
        </td>
        <td><span class="badge ${getCategoryBadgeClass(pkg.category)}">${escapeHtml(pkg.category)}</span></td>
        <td class="font-semibold text-orange-600">₹${parseInt(pkg.price).toLocaleString('en-IN')}</td>
        <td class="text-gray-600 text-sm">${escapeHtml(pkg.duration)}</td>
        <td>
          <div class="flex gap-2">
            <button onclick="editPackage(${pkg.id})" class="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="deletePackage(${pkg.id}, '${escapeHtml(pkg.name).replace(/'/g, "\\'")}')" class="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-500">
      <i class="fas fa-exclamation-circle mr-2"></i>Failed to load: ${err.message}
    </td></tr>`;
  }
}

function getCategoryBadgeClass(category) {
  const map = {
    'Kolkata': 'badge-green',
    'Travel': 'badge-blue',
    'Umrah': 'badge-orange',
    'Hajj': 'bg-red-100 text-red-700'
  };
  return map[category] || 'badge-blue';
}

function showPackageModal(pkg = null) {
  document.getElementById('packageForm').reset();
  document.getElementById('packageMessage').innerHTML = '';

  if (pkg) {
    document.getElementById('packageModalTitle').textContent = 'Edit Package';
    document.getElementById('packageBtnText').textContent = 'Update Package';
    document.getElementById('packageId').value = pkg.id;
    document.getElementById('packageName').value = pkg.name;
    document.getElementById('packageCategory').value = pkg.category;
    document.getElementById('packagePrice').value = pkg.price;
    document.getElementById('packageDuration').value = pkg.duration;
    document.getElementById('packageDescription').value = pkg.description;
    document.getElementById('packageImage').value = pkg.image_url || '';
  } else {
    document.getElementById('packageModalTitle').textContent = 'Add New Package';
    document.getElementById('packageBtnText').textContent = 'Save Package';
    document.getElementById('packageId').value = '';
  }

  document.getElementById('packageModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePackageModal() {
  document.getElementById('packageModal').classList.remove('active');
  document.body.style.overflow = '';
}

function editPackage(id) {
  const pkg = packagesCache.find(p => p.id === id);
  if (pkg) showPackageModal(pkg);
}

async function savePackage(event) {
  event.preventDefault();
  const btn = event.target.querySelector('button[type="submit"]');
  const msgEl = document.getElementById('packageMessage');
  const id = document.getElementById('packageId').value;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';

  const data = {
    name: document.getElementById('packageName').value.trim(),
    category: document.getElementById('packageCategory').value,
    price: parseInt(document.getElementById('packagePrice').value),
    duration: document.getElementById('packageDuration').value.trim(),
    description: document.getElementById('packageDescription').value.trim(),
    image_url: document.getElementById('packageImage').value.trim()
  };

  try {
    const url = id ? `${API_BASE}/packages/${id}` : `${API_BASE}/packages`;
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) await handleApiError(response);
    const result = await response.json();

    msgEl.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle"></i> Package ${id ? 'updated' : 'created'} successfully!</div>`;

    setTimeout(() => {
      closePackageModal();
      loadPackages();
      // Refresh pricing if on that section
      if (!document.getElementById('section-pricing').classList.contains('hidden')) {
        loadPricing();
      }
    }, 1000);
  } catch (err) {
    msgEl.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    document.getElementById('packageBtnText').textContent = id ? 'Update Package' : 'Save Package';
    btn.innerHTML = `<i class="fas fa-save mr-2"></i><span id="packageBtnText">${id ? 'Update Package' : 'Save Package'}</span>`;
  }
}

async function deletePackage(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`)) return;

  try {
    const response = await fetch(`${API_BASE}/packages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) await handleApiError(response);

    // Show success notification
    showToast(`Package "${name}" deleted successfully.`, 'success');
    loadPackages();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

// ============================================================
// BOOKINGS
// ============================================================

async function loadBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8"><div class="spinner mx-auto"></div></td></tr>';

  try {
    const response = await fetch(`${API_BASE}/bookings`, { headers: getAuthHeaders() });
    if (!response.ok) await handleApiError(response);
    const bookings = await response.json();

    if (!bookings.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">No bookings yet.</td></tr>';
      return;
    }

    // Sort by newest first
    const sorted = [...bookings].sort((a, b) => b.id - a.id);

    tbody.innerHTML = sorted.map(b => `
      <tr>
        <td class="text-gray-400 text-xs font-mono">#${b.id}</td>
        <td class="font-medium text-gray-800">${escapeHtml(b.name)}</td>
        <td>
          <a href="tel:${b.phone}" class="text-blue-600 hover:underline text-sm">${escapeHtml(b.phone)}</a>
        </td>
        <td>
          <span class="badge ${getServiceBadge(b.service_type)}">${escapeHtml(b.service_type || 'General')}</span>
        </td>
        <td class="text-gray-500 text-xs max-w-xs">
          <div class="truncate max-w-[180px]" title="${escapeHtml(parseDetails(b.details))}">${escapeHtml(parseDetails(b.details))}</div>
        </td>
        <td class="text-gray-400 text-xs whitespace-nowrap">${formatDate(b.booking_date || b.created_at)}</td>
        <td>
          <span class="badge badge-green">
            <i class="fas fa-check-circle mr-1"></i>Received
          </span>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-500">
      <i class="fas fa-exclamation-circle mr-2"></i>Failed to load: ${err.message}
    </td></tr>`;
  }
}

function getServiceBadge(type) {
  if (!type) return 'badge-blue';
  type = type.toLowerCase();
  if (type.includes('hajj') || type.includes('umrah')) return 'badge-orange';
  if (type.includes('flight')) return 'badge-blue';
  if (type.includes('train')) return 'badge-green';
  return 'badge-blue';
}

function parseDetails(details) {
  if (!details) return '-';
  try {
    const obj = JSON.parse(details);
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ');
  } catch {
    return details;
  }
}

// ============================================================
// PRICING
// ============================================================

async function loadPricing() {
  const tbody = document.getElementById('pricingTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8"><div class="spinner mx-auto"></div></td></tr>';

  try {
    const response = await fetch(`${API_BASE}/packages`);
    if (!response.ok) throw new Error('Server error');
    const packages = await response.json();

    tbody.innerHTML = packages.map(pkg => `
      <tr>
        <td class="font-medium text-gray-800">${escapeHtml(pkg.name)}</td>
        <td><span class="badge ${getCategoryBadgeClass(pkg.category)}">${escapeHtml(pkg.category)}</span></td>
        <td class="text-gray-500 text-sm">${escapeHtml(pkg.duration)}</td>
        <td class="font-semibold text-orange-600">₹${parseInt(pkg.price).toLocaleString('en-IN')}</td>
        <td>
          <input type="number"
            id="price-input-${pkg.id}"
            class="form-input w-32 text-sm py-2"
            value="${pkg.price}"
            min="0"
            placeholder="New price"
          />
        </td>
        <td>
          <button onclick="updatePricing(${pkg.id}, '${escapeHtml(pkg.name).replace(/'/g, "\\'")}')"
            class="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
            <i class="fas fa-save"></i> Save
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-500">Failed to load: ${err.message}</td></tr>`;
  }
}

async function updatePricing(id, name) {
  const input = document.getElementById(`price-input-${id}`);
  const newPrice = parseInt(input.value);

  if (isNaN(newPrice) || newPrice < 0) {
    showToast('Please enter a valid price.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/packages/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ price: newPrice })
    });

    if (!response.ok) await handleApiError(response);

    showToast(`Price updated for "${name}": ₹${newPrice.toLocaleString('en-IN')}`, 'success');
    loadPricing();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

// ============================================================
// CONTENT
// ============================================================

function saveContent() {
  // In a real app, this would save to the backend
  // For now, show success message
  const msgEl = document.getElementById('contentMessage');
  msgEl.innerHTML = `<div class="alert alert-success">
    <i class="fas fa-check-circle"></i>
    Content settings saved successfully! (Note: In production, these would be saved to the database and reflected on the website.)
  </div>`;
  setTimeout(() => { msgEl.innerHTML = ''; }, 4000);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

let toastTimeout;
function showToast(message, type = 'success') {
  clearTimeout(toastTimeout);
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;min-width:300px;text-align:center;';
    document.body.appendChild(toast);
  }
  const bg = type === 'success' ? '#166534' : '#dc2626';
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  toast.innerHTML = `
    <div style="background:${bg};color:white;padding:12px 24px;border-radius:12px;box-shadow:0 8px 25px rgba(0,0,0,0.2);font-size:0.9rem;font-weight:500;display:inline-flex;align-items:center;gap:8px;">
      <i class="fas ${icon}"></i>${escapeHtml(message)}
    </div>`;
  toast.style.opacity = '1';
  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.innerHTML = ''; }, 300);
  }, 3000);
}

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const token = checkAuth();
  if (!token) return;

  // Load overview by default
  loadOverview();

  // Close package modal on backdrop click
  const pkgModal = document.getElementById('packageModal');
  if (pkgModal) {
    pkgModal.addEventListener('click', (e) => {
      if (e.target === pkgModal) closePackageModal();
    });
  }

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePackageModal();
  });
});
