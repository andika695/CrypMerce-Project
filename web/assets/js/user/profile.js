document.addEventListener('DOMContentLoaded', function() {
    
    /* ----------------------------------------------------
       1. SIDEBAR NAVIGATION LOGIC
    ----------------------------------------------------- */
    const menuItems = document.querySelectorAll('.menu-item');
    const views = document.querySelectorAll('.view');

    menuItems.forEach(item => {
        item.addEventListener("click", function() {
            const page = item.getAttribute('data-page');

            // Handle Logout
            if (page === "logout") {
                openLogoutModal();
                return;
            }

            // Update Active Sidebar Item
            menuItems.forEach(i => i.classList.remove("active"));
            this.classList.add("active");

            // Hide All Views
            views.forEach(view => {
                view.classList.remove("active");
                view.style.display = "none";
            });

            // Show Target View
            const targetView = document.getElementById(`${page}-view`);
            if (targetView) {
                targetView.style.display = "block";
                setTimeout(() => targetView.classList.add("active"), 10);
            }
        });
    });

    /* ----------------------------------------------------
       2. EDIT PROFILE FORM LOGIC (AJAX)
    ----------------------------------------------------- */
    const editForm = document.getElementById("edit-profile-form");
    if (editForm) {
        editForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            
            // Loading State
            submitBtn.innerText = "Menyimpan...";
            submitBtn.disabled = true;

            fetch('../api/user/update-profile.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Berhasil: " + data.message);
                    closeEditProfileModal();
                    
                    // Update UI immediately
                    if (data.new_name) {
                        updateProfileName(data.new_name);
                    }
                    if (data.new_photo) {
                        updateProfilePhoto(data.new_photo);
                    }
                } else {
                    alert("Gagal: " + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("Terjadi kesalahan koneksi.");
            })
            .finally(() => {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            });
        });
    }

}); // End of DOMContentLoaded

/* ----------------------------------------------------
   3. HELPER FUNCTIONS (Global Scope)
----------------------------------------------------- */

function openEditProfileModal(){
    const modal = document.getElementById("edit-profile-modal");
    if (modal) modal.classList.add("active");
}

function closeEditProfileModal(){
    const modal = document.getElementById("edit-profile-modal");
    if (modal) modal.classList.remove("active");
}

function openLogoutModal(){
    const modal = document.getElementById("logout-modal");
    if (modal) modal.classList.add("active");
}

function closeLogoutModal(){
    const modal = document.getElementById("logout-modal");
    if (modal) modal.classList.remove("active");
}

function updateProfileName(newName) {
    const sidebarName = document.getElementById('sidebar-user-name');
    const viewName = document.getElementById('user-name');
    if (sidebarName) sidebarName.textContent = newName;
    if (viewName) viewName.textContent = newName;
}

function updateProfilePhoto(photo) {
    // Detect if the photo is a full URL (Cloudinary) or just a filename
    const isUrl = photo.startsWith('http');
    const fullPath = isUrl ? photo : '../assets/images/user/' + photo;
    
    // Add timestamp to bypass cache if it's not a Cloudinary URL (Cloudinary URLs are usually unique per upload)
    const finalSrc = isUrl ? photo : fullPath + '?t=' + new Date().getTime();
    
    const sidebarImg = document.getElementById('sidebar-img');
    const viewImg = document.getElementById('profile-view-img');
    
    if (sidebarImg) sidebarImg.src = finalSrc;
    if (viewImg) viewImg.src = finalSrc;
}

// Close Modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}