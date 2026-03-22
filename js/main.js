// India Tours & Travels - Frontend JavaScript
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatPrice(price) {
  return '₹' + parseInt(price).toLocaleString('en-IN');
}

function showAlert(containerId, message, type = 'success') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  container.innerHTML = `
    <div class="alert alert-${type}">
      <i class="fas ${iconClass}"></i>
      ${message}
    </div>`;
  setTimeout(() => { container.innerHTML = ''; }, 5000);
}

function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// ============================================================
// MOBILE MENU
// ============================================================

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (!menu) return;
  menu.classList.toggle('open');
  const icon = document.getElementById('menuIcon');
  if (icon) {
    icon.className = menu.classList.contains('open')
      ? 'fas fa-times text-white text-xl'
      : 'fas fa-bars text-white text-xl';
  }
}

// ============================================================
// STICKY NAVBAR
// ============================================================

window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
});

// ============================================================
// BOOKING FORM TABS (Quick booking on homepage)
// ============================================================

function switchTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.booking-tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });
  // Deactivate all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  // Show selected tab
  const selectedTab = document.getElementById('tab-' + tabName);
  if (selectedTab) selectedTab.classList.remove('hidden');
  // Activate selected button
  const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedBtn) selectedBtn.classList.add('active');
}

// ============================================================
// TRAVEL PAGE TABS
// ============================================================

function switchTravelTab(tabName) {
  document.querySelectorAll('.travel-tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });
  document.querySelectorAll('.travel-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const selectedTab = document.getElementById('travel-tab-' + tabName);
  if (selectedTab) selectedTab.classList.remove('hidden');
  const selectedBtn = document.querySelector(`[data-travel-tab="${tabName}"]`);
  if (selectedBtn) selectedBtn.classList.add('active');
}

// ============================================================
// BOOKING MODAL
// ============================================================

function openBookingModal(packageName, price) {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.add('active');

  const packageField = document.getElementById('modalPackageName');
  if (packageField && packageName) {
    packageField.value = packageName;
  }

  const priceDisplay = document.getElementById('modalPriceDisplay');
  if (priceDisplay && price) {
    priceDisplay.textContent = formatPrice(price);
    priceDisplay.parentElement.classList.remove('hidden');
  }

  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';

  // Reset form
  const form = document.getElementById('bookingForm');
  if (form) form.reset();

  const msgContainer = document.getElementById('bookingMessage');
  if (msgContainer) msgContainer.innerHTML = '';
}

// Close modal on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('bookingModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});

// ============================================================
// SUBMIT BOOKING (Modal form)
// ============================================================

async function submitBooking(event) {
  event.preventDefault();
  const form = event.target;
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;

  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
  btn.disabled = true;

  const data = {
    name: document.getElementById('bookingName').value.trim(),
    phone: document.getElementById('bookingPhone').value.trim(),
    service_type: document.getElementById('modalPackageName')?.value || 'Package Booking',
    details: document.getElementById('bookingDetails')?.value?.trim() || '',
    booking_date: new Date().toISOString().split('T')[0]
  };

  try {
    const response = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    // Safely parse JSON — server might return empty body on success
    let result = {};
    try { result = await response.json(); } catch (e) {}

    if (response.ok) {
      document.getElementById('bookingMessage').innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          Booking confirmed! We'll contact you at ${data.phone} shortly.
        </div>`;
      form.reset();
      setTimeout(() => closeModal(), 3000);
    } else {
      throw new Error(result.error || 'Booking failed');
    }
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      document.getElementById('bookingMessage').innerHTML = `
        <div class="alert alert-error">
          <i class="fas fa-exclamation-circle"></i>
          Server not reachable. Please contact us via <a href="https://wa.me/919876543210" target="_blank" class="underline font-bold">WhatsApp</a>.
        </div>`;
    } else {
      document.getElementById('bookingMessage').innerHTML = `
        <div class="alert alert-error">
          <i class="fas fa-exclamation-circle"></i>
          ${err.message}
        </div>`;
    }
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ============================================================
// SUBMIT QUICK BOOKING (Travel forms)
// ============================================================

async function submitTravelBooking(event, serviceType) {
  event.preventDefault();
  const form = event.target;
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;

  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
  btn.disabled = true;

  const formData = new FormData(form);
  const details = {};
  formData.forEach((value, key) => {
    if (!['name', 'phone'].includes(key)) details[key] = value;
  });

  const data = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    service_type: serviceType,
    details: JSON.stringify(details),
    booking_date: formData.get('date') || new Date().toISOString().split('T')[0]
  };

  const msgEl = form.querySelector('.form-message');

  try {
    const response = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    // Safely parse JSON — server might return empty body on success
    let result = {};
    try { result = await response.json(); } catch (e) {}

    if (response.ok) {
      if (msgEl) msgEl.innerHTML = `
        <div class="alert alert-success mt-4">
          <i class="fas fa-check-circle"></i>
          Booking request submitted! We'll contact you at ${data.phone} within 30 minutes.
        </div>`;
      form.reset();
    } else {
      throw new Error(result.error || 'Booking failed');
    }
  } catch (err) {
    const errorMsg = err.message === 'Failed to fetch'
      ? 'Server not reachable. WhatsApp us at <a href="https://wa.me/919876543210" class="underline">+91 98765 43210</a>'
      : err.message;
    if (msgEl) msgEl.innerHTML = `
      <div class="alert alert-error mt-4">
        <i class="fas fa-exclamation-circle"></i>
        ${errorMsg}
      </div>`;
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ============================================================
// LOAD FEATURED PACKAGES (Homepage)
// ============================================================

async function loadFeaturedPackages() {
  const container = document.getElementById('featured-packages');
  if (!container) return;

  container.innerHTML = '<div class="col-span-3 text-center py-8"><div class="spinner"></div><p class="text-gray-500 mt-2">Loading packages...</p></div>';

  try {
    const response = await fetch(`${API_BASE}/packages?category=Kolkata&limit=3`);
    if (!response.ok) throw new Error('Server error');
    const packages = await response.json();

    if (!packages.length) {
      container.innerHTML = '<div class="col-span-3 text-center py-8 text-gray-500">No packages available at the moment.</div>';
      return;
    }

    container.innerHTML = packages.map((pkg, i) => `
      <div class="package-card shadow-md border border-gray-100 fade-in stagger-${i + 1}">
        <div class="card-image relative overflow-hidden">
          <img src="${getPackageImage(pkg.name, pkg.category)}"
               alt="${pkg.name}"
               class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
          <div class="img-placeholder ${getGradientClass(pkg.category, pkg.name)} items-center justify-center" style="display:none;">
            <div class="text-center text-white">
              <i class="${getPackageIcon(pkg.name)} text-4xl mb-2 opacity-80"></i>
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 px-3 py-2" style="background:linear-gradient(0deg,rgba(0,0,0,0.6) 0%,transparent 100%)">
            <span class="text-white text-xs font-semibold"><i class="fas fa-clock mr-1 opacity-80"></i>${pkg.duration}</span>
          </div>
        </div>
        <div class="p-5">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold text-gray-800 text-base leading-tight flex-1">${pkg.name}</h3>
            <span class="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">${pkg.duration}</span>
          </div>
          <p class="text-gray-500 text-sm mb-4 line-clamp-2">${pkg.description}</p>
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs text-gray-400">Starting from</span>
              <p class="text-xl font-bold text-orange-600">${formatPrice(pkg.price)}</p>
            </div>
            <button onclick="openBookingModal('${pkg.name.replace(/'/g, "\\'")}', ${pkg.price})"
              class="btn-primary text-sm px-4 py-2">
              <i class="fas fa-calendar-check mr-1"></i> Book Now
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `
      <div class="col-span-3 text-center py-12">
        <div class="text-gray-400 mb-4"><i class="fas fa-wifi text-4xl"></i></div>
        <p class="text-gray-600 mb-2">Unable to load packages from server.</p>
        <a href="https://wa.me/919876543210" target="_blank" class="btn-primary inline-block mt-2">
          <i class="fab fa-whatsapp mr-2"></i>Contact via WhatsApp
        </a>
      </div>`;
  }
}

// ============================================================
// LOAD ALL PACKAGES (packages.html)
// ============================================================

let allPackages = [];
let currentFilter = 'all';

async function loadPackages(filter = 'all') {
  currentFilter = filter;
  const container = document.getElementById('packages-grid');
  if (!container) return;

  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-green-700', 'text-white');
    btn.classList.add('bg-gray-100', 'text-gray-600');
  });
  const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active', 'bg-green-700', 'text-white');
    activeBtn.classList.remove('bg-gray-100', 'text-gray-600');
  }

  if (!allPackages.length) {
    container.innerHTML = '<div class="col-span-3 text-center py-8"><div class="spinner"></div></div>';
    try {
      const response = await fetch(`${API_BASE}/packages?category=Kolkata`);
      if (!response.ok) throw new Error('Failed to fetch');
      allPackages = await response.json();
    } catch (err) {
      container.innerHTML = `
        <div class="col-span-3 text-center py-16">
          <i class="fas fa-server text-gray-300 text-5xl mb-4"></i>
          <p class="text-gray-500 text-lg mb-4">Unable to load packages. Backend server not running.</p>
          <a href="https://wa.me/919876543210" target="_blank" class="btn-primary inline-block">
            <i class="fab fa-whatsapp mr-2"></i>Enquire via WhatsApp
          </a>
        </div>`;
      return;
    }
  }

  let filtered = allPackages;
  if (filter === '1day') filtered = allPackages.filter(p => p.duration.includes('1'));
  else if (filter === '2-3days') filtered = allPackages.filter(p => {
    const days = parseInt(p.duration);
    return days >= 2 && days <= 3;
  });
  else if (filter === '5plus') filtered = allPackages.filter(p => parseInt(p.duration) >= 5);

  if (!filtered.length) {
    container.innerHTML = '<div class="col-span-3 text-center py-12 text-gray-500">No packages found for this filter.</div>';
    return;
  }

  container.innerHTML = filtered.map((pkg, i) => `
    <div class="package-card shadow-md border border-gray-100 fade-in">
      <div class="card-image relative overflow-hidden">
        <img src="${getPackageImage(pkg.name, pkg.category)}"
             alt="${pkg.name}"
             class="w-full h-full object-cover transition-transform duration-500"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
        <div class="img-placeholder ${getGradientClass(pkg.category, pkg.name)} items-center justify-center h-full" style="display:none;">
          <div class="text-center text-white">
            <i class="${getPackageIcon(pkg.name)} text-5xl mb-2 opacity-80"></i>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 px-3 py-2" style="background:linear-gradient(0deg,rgba(0,0,0,0.6) 0%,transparent 100%)">
          <span class="text-white text-xs font-semibold"><i class="fas fa-clock mr-1 opacity-80"></i>${pkg.duration}</span>
        </div>
      </div>
      <div class="p-5">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-semibold text-gray-800 text-base flex-1">${pkg.name}</h3>
          <span class="ml-2 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">${pkg.duration}</span>
        </div>
        <p class="text-gray-500 text-sm mb-4">${pkg.description}</p>
        <div class="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span class="text-xs text-gray-400">Per person</span>
            <p class="text-xl font-bold text-orange-600">${formatPrice(pkg.price)}</p>
          </div>
          <button onclick="openBookingModal('${pkg.name.replace(/'/g, "\\'")}', ${pkg.price})"
            class="btn-primary text-sm px-4 py-2">
            <i class="fas fa-calendar-check mr-1"></i> Book Now
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// LOAD HAJJ UMRAH PACKAGES
// ============================================================

async function loadHajjUmrahPackages(type = 'Umrah') {
  const container = document.getElementById('hajj-packages-grid');
  if (!container) return;

  container.innerHTML = '<div class="col-span-2 text-center py-8"><div class="spinner"></div></div>';

  try {
    const response = await fetch(`${API_BASE}/packages?category=${type}`);
    if (!response.ok) throw new Error('Server error');
    const packages = await response.json();

    if (!packages.length) {
      container.innerHTML = '<div class="col-span-2 text-center py-8 text-amber-800">No packages available.</div>';
      return;
    }

    container.innerHTML = packages.map((pkg, i) => {
      const isPremium = pkg.name.toLowerCase().includes('premium');
      return `
        <div class="hajj-card ${isPremium ? 'premium' : ''} p-6 fade-in stagger-${(i % 4) + 1}">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${type === 'Hajj' ? 'bg-orange-200 text-orange-800' : 'bg-purple-100 text-purple-800'}">
              ${pkg.category}
            </span>
            ${isPremium ? '<span class="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">★ Premium</span>' : ''}
          </div>
          <h3 class="text-lg font-bold text-gray-800 mb-1">${pkg.name}</h3>
          <p class="text-gray-600 text-sm mb-4">${pkg.description}</p>
          <ul class="space-y-2 mb-5">
            <li class="flex items-center gap-2 text-sm text-gray-700">
              <i class="fas fa-calendar-alt text-green-600 w-4"></i> ${pkg.duration}
            </li>
            <li class="flex items-center gap-2 text-sm text-gray-700">
              <i class="fas fa-plane text-green-600 w-4"></i> Return flights included
            </li>
            <li class="flex items-center gap-2 text-sm text-gray-700">
              <i class="fas fa-id-card text-green-600 w-4"></i> Visa assistance included
            </li>
            <li class="flex items-center gap-2 text-sm text-gray-700">
              <i class="fas fa-hotel text-green-600 w-4"></i> ${getHotelInfo(pkg.name)}
            </li>
          </ul>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500">Starting from</p>
              <p class="text-2xl font-bold text-orange-600">${formatPrice(pkg.price)}</p>
            </div>
            <button onclick="openBookingModal('${pkg.name.replace(/'/g, "\\'")}', ${pkg.price})"
              class="btn-orange text-sm px-5 py-2">
              <i class="fas fa-paper-plane mr-1"></i> Enquire Now
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `
      <div class="col-span-2 text-center py-12">
        <i class="fas fa-mosque text-amber-300 text-5xl mb-4"></i>
        <p class="text-amber-800 mb-4">Unable to load packages. Please contact us directly.</p>
        <a href="https://wa.me/919876543210" target="_blank" class="btn-orange inline-block">
          <i class="fab fa-whatsapp mr-2"></i>WhatsApp Us
        </a>
      </div>`;
  }
}

function switchHajjTab(type) {
  document.querySelectorAll('.hajj-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`[data-hajj-tab="${type}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  loadHajjUmrahPackages(type);
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getGradientClass(category, name) {
  if (name && name.toLowerCase().includes('sundarban')) return 'gradient-sundarban';
  if (name && name.toLowerCase().includes('darjeeling')) return 'gradient-darjeeling';
  if (name && (name.toLowerCase().includes('heritage') || name.toLowerCase().includes('north'))) return 'gradient-heritage';
  if (category === 'Umrah') return 'gradient-umrah';
  if (category === 'Hajj') return 'gradient-hajj';
  return 'gradient-kolkata';
}

function getPackageIcon(name) {
  if (!name) return 'fas fa-map-marked-alt';
  name = name.toLowerCase();
  if (name.includes('city') || name.includes('kolkata')) return 'fas fa-city';
  if (name.includes('heritage')) return 'fas fa-landmark';
  if (name.includes('sundarban') || name.includes('forest')) return 'fas fa-tree';
  if (name.includes('darjeeling') || name.includes('mountain')) return 'fas fa-mountain';
  if (name.includes('umrah') || name.includes('hajj')) return 'fas fa-mosque';
  return 'fas fa-map-marked-alt';
}

function getPackageImage(name, category) {
  if (!name) name = '';
  const n = name.toLowerCase();
  // Specific package types → curated Unsplash photos
  if (n.includes('sundarban')) return 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80';
  if (n.includes('darjeeling')) return 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80';
  if (n.includes('heritage') || n.includes('north')) return 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=600&q=80';
  if (n.includes('city') || n.includes('kolkata')) return 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=600&q=80';
  if (category === 'Umrah' || n.includes('umrah')) return 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=600&q=80';
  if (category === 'Hajj' || n.includes('hajj')) return 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=600&q=80';
  // Default: Kolkata cityscape
  return 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80';
}

function getHotelInfo(name) {
  if (!name) return 'Standard accommodation';
  name = name.toLowerCase();
  if (name.includes('premium')) return '5-star hotels near Haram';
  if (name.includes('deluxe')) return '4-star hotels near Haram';
  return 'Economy hotels';
}

// ============================================================
// HOMEPAGE QUICK BOOKING FORM SUBMIT
// ============================================================

function submitQuickBooking(event, type) {
  event.preventDefault();
  openBookingModal(`${type} Booking`, null);
}

// ============================================================
// INITIALIZE PAGE
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname;

  // Homepage
  if (page.endsWith('index.html') || page === '/' || page.endsWith('/')) {
    loadFeaturedPackages();
    switchTab('travel');
  }

  // Packages page
  if (page.includes('packages.html')) {
    loadPackages('all');
  }

  // Hajj & Umrah page
  if (page.includes('hajj-umrah.html')) {
    loadHajjUmrahPackages('Umrah');
  }

  // Travel page - read URL param
  if (page.includes('travel.html')) {
    const type = getUrlParam('type') || 'train';
    switchTravelTab(type.toLowerCase());
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
