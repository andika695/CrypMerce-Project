document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-menu a');
    const editButtons = document.querySelectorAll('.edit-btn');
    const addEmailLink = document.querySelector('.add-email');
    const dateElement = document.querySelector('.date');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cardTitle = this.closest('.profile-card').querySelector('h2').textContent;
            alert(`Edit ${cardTitle} functionality would open here.`);
        });
    });
    
    addEmailLink.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Add new email address functionality would open here.');
    });
    
    const today = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('en-US', options);
});